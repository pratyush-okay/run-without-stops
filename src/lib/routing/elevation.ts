import { distanceMeters } from "@/lib/geo";
import type { ElevationMark, RouteElevation, RouteMetrics } from "@/lib/schemas/route";

export type ElevatedPoint = {
  lng: number;
  lat: number;
  elevationMeters: number;
};

export type ElevationSummary = {
  ascentMeters: number;
  descentMeters: number;
  minElevationMeters: number;
  maxElevationMeters: number;
  elevation: RouteElevation;
};

const PROFILE_SAMPLES = 120;
const SMOOTH_WINDOW_METERS = 40;
const GRADE_WINDOW_METERS = 80;
const CLIMB_GRADE = 0.038;
const DESCENT_GRADE = -0.038;
const MIN_STRETCH_METERS = 90;
const MIN_MARK_SEPARATION_METERS = 140;
const NOISE_METERS = 0.8;

export function elevatedPointsFromCoordinates(
  coordinates: Array<[number, number] | [number, number, number]>,
) {
  const points: ElevatedPoint[] = [];
  for (const coordinate of coordinates) {
    const elevationMeters = coordinate[2];
    if (elevationMeters === undefined || !Number.isFinite(elevationMeters)) continue;
    points.push({ lng: coordinate[0], lat: coordinate[1], elevationMeters });
  }
  return points.length >= 2 ? points : undefined;
}

export function summarizeElevation(
  points: ElevatedPoint[],
  provided?: { ascentMeters?: number; descentMeters?: number },
): ElevationSummary | undefined {
  if (points.length < 2) return undefined;

  const distances = cumulativeDistances(points);
  const smoothed = smoothElevations(
    points.map((point) => point.elevationMeters),
    distances,
  );
  const computed = gainAndLoss(smoothed);
  const samples = profileSamples(points, distances, smoothed);
  const marks = climbDescentMarks(points, distances, smoothed);

  return {
    ascentMeters: provided?.ascentMeters ?? computed.ascentMeters,
    descentMeters: provided?.descentMeters ?? computed.descentMeters,
    minElevationMeters: Math.min(...smoothed),
    maxElevationMeters: Math.max(...smoothed),
    elevation: { samples, marks },
  };
}

export function applyElevationToMetrics(
  metrics: RouteMetrics,
  summary: ElevationSummary | undefined,
): RouteMetrics {
  if (!summary) return metrics;
  return {
    ...metrics,
    ascentMeters: roundElevation(summary.ascentMeters),
    descentMeters: roundElevation(summary.descentMeters),
    minElevationMeters: roundElevation(summary.minElevationMeters),
    maxElevationMeters: roundElevation(summary.maxElevationMeters),
  };
}

function cumulativeDistances(points: ElevatedPoint[]) {
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) continue;
    distances.push(
      (distances[index - 1] ?? 0) +
        distanceMeters(
          { lat: previous.lat, lng: previous.lng },
          { lat: current.lat, lng: current.lng },
        ),
    );
  }
  return distances;
}

function smoothElevations(elevations: number[], distances: number[]) {
  return elevations.map((_, index) => {
    const center = distances[index] ?? 0;
    let total = 0;
    let weight = 0;
    for (let cursor = 0; cursor < elevations.length; cursor += 1) {
      const distance = Math.abs((distances[cursor] ?? 0) - center);
      if (distance > SMOOTH_WINDOW_METERS) continue;
      const value = elevations[cursor];
      if (value === undefined) continue;
      const nextWeight = 1 - distance / SMOOTH_WINDOW_METERS;
      total += value * nextWeight;
      weight += nextWeight;
    }
    return weight > 0 ? total / weight : (elevations[index] ?? 0);
  });
}

function gainAndLoss(elevations: number[]) {
  let ascentMeters = 0;
  let descentMeters = 0;
  for (let index = 1; index < elevations.length; index += 1) {
    const previous = elevations[index - 1];
    const current = elevations[index];
    if (previous === undefined || current === undefined) continue;
    const delta = current - previous;
    if (delta > NOISE_METERS) ascentMeters += delta;
    if (delta < -NOISE_METERS) descentMeters -= delta;
  }
  return { ascentMeters, descentMeters };
}

function profileSamples(points: ElevatedPoint[], distances: number[], elevations: number[]) {
  const total = distances.at(-1) ?? 0;
  if (total <= 0) {
    return points.slice(0, 2).map((point, index) => ({
      distanceMeters: 0,
      elevationMeters: roundElevation(elevations[index] ?? point.elevationMeters),
      lat: point.lat,
      lng: point.lng,
    }));
  }

  const count = Math.min(PROFILE_SAMPLES, points.length);
  const samples = [];
  for (let index = 0; index < count; index += 1) {
    const target = (total * index) / (count - 1);
    const at = indexAtDistance(distances, target);
    const point = points[at];
    samples.push({
      distanceMeters: Math.round(target),
      elevationMeters: roundElevation(elevations[at] ?? point?.elevationMeters ?? 0),
      ...(point ? { lat: point.lat, lng: point.lng } : {}),
    });
  }
  return samples;
}

function climbDescentMarks(
  points: ElevatedPoint[],
  distances: number[],
  elevations: number[],
): ElevationMark[] {
  const grades = points.map((_, index) => gradeAhead(distances, elevations, index));
  const kinds = grades.map((grade) =>
    grade >= CLIMB_GRADE ? "climb" : grade <= DESCENT_GRADE ? "descent" : "flat",
  );
  const marks: ElevationMark[] = [];

  for (let index = 0; index < kinds.length; index += 1) {
    const kind = kinds[index];
    if (kind !== "climb" && kind !== "descent") continue;
    if (kinds[index - 1] === kind) continue;
    if (!sustainedStretch(kinds, distances, index, kind, MIN_STRETCH_METERS)) continue;
    const last = marks.at(-1);
    const here = distances[index] ?? 0;
    if (
      last &&
      Math.abs(here - markDistance(last, points, distances)) < MIN_MARK_SEPARATION_METERS
    ) {
      continue;
    }
    const point = points[index];
    const elevationMeters = elevations[index];
    if (!point || elevationMeters === undefined) continue;
    marks.push({
      kind,
      point: { lat: point.lat, lng: point.lng },
      elevationMeters: roundElevation(elevationMeters),
    });
  }

  return marks.slice(0, 24);
}

function gradeAhead(distances: number[], elevations: number[], index: number) {
  const startDistance = distances[index] ?? 0;
  const startElevation = elevations[index];
  if (startElevation === undefined) return 0;
  for (let cursor = index + 1; cursor < distances.length; cursor += 1) {
    const span = (distances[cursor] ?? 0) - startDistance;
    if (span < GRADE_WINDOW_METERS && cursor < distances.length - 1) continue;
    const endElevation = elevations[cursor];
    if (endElevation === undefined || span <= 0) return 0;
    return (endElevation - startElevation) / span;
  }
  return 0;
}

function sustainedStretch(
  kinds: Array<"climb" | "descent" | "flat">,
  distances: number[],
  start: number,
  kind: "climb" | "descent",
  minMeters: number,
) {
  const origin = distances[start] ?? 0;
  for (let index = start; index < kinds.length; index += 1) {
    if (kinds[index] !== kind) return false;
    if ((distances[index] ?? 0) - origin >= minMeters) return true;
  }
  return (distances.at(-1) ?? 0) - origin >= minMeters * 0.6;
}

function markDistance(mark: ElevationMark, points: ElevatedPoint[], distances: number[]) {
  const index = points.findIndex(
    (point) => point.lat === mark.point.lat && point.lng === mark.point.lng,
  );
  return distances[index] ?? 0;
}

function indexAtDistance(distances: number[], target: number) {
  let closest = 0;
  let closestGap = Number.POSITIVE_INFINITY;
  for (let index = 0; index < distances.length; index += 1) {
    const gap = Math.abs((distances[index] ?? 0) - target);
    if (gap < closestGap) {
      closest = index;
      closestGap = gap;
    }
  }
  return closest;
}

function roundElevation(value: number) {
  return Math.round(value * 10) / 10;
}

export function subsampleCoordinates(coordinates: [number, number][], maxPoints = 160) {
  if (coordinates.length <= maxPoints) return coordinates;
  const step = (coordinates.length - 1) / (maxPoints - 1);
  const sampled: [number, number][] = [];
  for (let index = 0; index < maxPoints; index += 1) {
    const point = coordinates[Math.round(index * step)];
    if (point) sampled.push(point);
  }
  return sampled;
}

export function pointsFromHeightLookup(
  coordinates: [number, number][],
  heights: number[],
): ElevatedPoint[] | undefined {
  if (coordinates.length !== heights.length || coordinates.length < 2) return undefined;
  return coordinates.map(([lng, lat], index) => ({
    lng,
    lat,
    elevationMeters: heights[index] ?? 0,
  }));
}
