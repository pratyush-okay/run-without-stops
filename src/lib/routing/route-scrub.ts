import { distanceMeters } from "@/lib/geo";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteElevation } from "@/lib/schemas/route";

export type RouteScrub = {
  distanceMeters: number;
  elevationMeters: number;
  gradePercent: number | undefined;
  point: GeoPoint;
};

const METERS_PER_DEG_LAT = 111_320;

function lngScale(lat: number) {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

function cumulativeDistances(coordinates: [number, number][]) {
  const distances = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    if (!previous || !current) continue;
    distances.push(
      (distances[index - 1] ?? 0) +
        distanceMeters(
          { lat: previous[1], lng: previous[0] },
          { lat: current[1], lng: current[0] },
        ),
    );
  }
  return distances;
}

function projectOnSegment(
  start: [number, number],
  end: [number, number],
  point: GeoPoint,
): { point: GeoPoint; t: number; distance: number } {
  const mx = lngScale((start[1] + end[1]) / 2);
  const ax = start[0] * mx;
  const ay = start[1] * METERS_PER_DEG_LAT;
  const bx = end[0] * mx;
  const by = end[1] * METERS_PER_DEG_LAT;
  const px = point.lng * mx;
  const py = point.lat * METERS_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const length2 = dx * dx + dy * dy;
  const t =
    length2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / length2));
  const snapped = {
    lng: start[0] + (end[0] - start[0]) * t,
    lat: start[1] + (end[1] - start[1]) * t,
  };
  return { point: snapped, t, distance: distanceMeters(point, snapped) };
}

export function elevationAtDistance(
  samples: RouteElevation["samples"],
  distanceMetersValue: number,
) {
  if (samples.length === 0) return 0;
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) return 0;
  if (distanceMetersValue <= first.distanceMeters) return first.elevationMeters;
  if (distanceMetersValue >= last.distanceMeters) return last.elevationMeters;

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (!previous || !current) continue;
    if (distanceMetersValue > current.distanceMeters) continue;
    const span = current.distanceMeters - previous.distanceMeters;
    const mix = span <= 0 ? 0 : (distanceMetersValue - previous.distanceMeters) / span;
    return previous.elevationMeters + (current.elevationMeters - previous.elevationMeters) * mix;
  }

  return last.elevationMeters;
}

export function gradeAtDistance(
  samples: RouteElevation["samples"],
  distanceMetersValue: number,
): number | undefined {
  if (samples.length < 2) return undefined;
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) return undefined;

  let previous = first;
  let current = samples[1] ?? last;
  if (distanceMetersValue > first.distanceMeters && distanceMetersValue < last.distanceMeters) {
    for (let index = 1; index < samples.length; index += 1) {
      const earlier = samples[index - 1];
      const later = samples[index];
      if (!earlier || !later) continue;
      previous = earlier;
      current = later;
      if (distanceMetersValue <= later.distanceMeters) break;
    }
  } else if (distanceMetersValue >= last.distanceMeters) {
    previous = samples.at(-2) ?? first;
    current = last;
  }

  const span = current.distanceMeters - previous.distanceMeters;
  if (span <= 0) return 0;
  return ((current.elevationMeters - previous.elevationMeters) / span) * 100;
}

export function pointAtDistance(
  coordinates: [number, number][],
  targetMeters: number,
): GeoPoint | undefined {
  if (coordinates.length < 2) return undefined;
  const distances = cumulativeDistances(coordinates);
  const total = distances.at(-1) ?? 0;
  const clamped = Math.min(Math.max(targetMeters, 0), total);

  for (let index = 1; index < coordinates.length; index += 1) {
    const startDistance = distances[index - 1] ?? 0;
    const endDistance = distances[index] ?? startDistance;
    if (clamped > endDistance && index < coordinates.length - 1) continue;
    const start = coordinates[index - 1];
    const end = coordinates[index];
    if (!start || !end) return undefined;
    const span = endDistance - startDistance;
    const mix = span <= 0 ? 0 : (clamped - startDistance) / span;
    return {
      lng: start[0] + (end[0] - start[0]) * mix,
      lat: start[1] + (end[1] - start[1]) * mix,
    };
  }

  const last = coordinates.at(-1);
  return last ? { lng: last[0], lat: last[1] } : undefined;
}

export function nearestScrubOnRoute(
  coordinates: [number, number][],
  samples: RouteElevation["samples"],
  hover: GeoPoint,
  maxSnapMeters = 36,
): RouteScrub | undefined {
  if (coordinates.length < 2) return undefined;
  const distances = cumulativeDistances(coordinates);
  let best:
    | {
        point: GeoPoint;
        distanceMeters: number;
        snap: number;
      }
    | undefined;

  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1];
    const end = coordinates[index];
    if (!start || !end) continue;
    const projected = projectOnSegment(start, end, hover);
    const along =
      (distances[index - 1] ?? 0) +
      projected.t * ((distances[index] ?? 0) - (distances[index - 1] ?? 0));
    if (!best || projected.distance < best.snap) {
      best = { point: projected.point, distanceMeters: along, snap: projected.distance };
    }
  }

  if (!best || best.snap > maxSnapMeters) return undefined;
  return {
    distanceMeters: best.distanceMeters,
    elevationMeters: elevationAtDistance(samples, best.distanceMeters),
    gradePercent: gradeAtDistance(samples, best.distanceMeters),
    point: best.point,
  };
}

export function scrubAtDistance(
  coordinates: [number, number][],
  samples: RouteElevation["samples"],
  distanceMetersValue: number,
): RouteScrub | undefined {
  const point = pointAtDistance(coordinates, distanceMetersValue);
  if (!point) return undefined;
  return {
    distanceMeters: Math.max(0, distanceMetersValue),
    elevationMeters: elevationAtDistance(samples, distanceMetersValue),
    gradePercent: gradeAtDistance(samples, distanceMetersValue),
    point,
  };
}

export function routePrefix(
  coordinates: [number, number][],
  targetMeters: number,
): [number, number][] {
  if (coordinates.length < 2) return [];
  const distances = cumulativeDistances(coordinates);
  const prefix: [number, number][] = [];
  for (let index = 0; index < coordinates.length; index += 1) {
    const coordinate = coordinates[index];
    const distance = distances[index] ?? 0;
    if (!coordinate) continue;
    if (distance <= targetMeters) {
      prefix.push(coordinate);
      continue;
    }
    const point = pointAtDistance(coordinates, targetMeters);
    if (point) prefix.push([point.lng, point.lat]);
    break;
  }
  return prefix.length >= 2 ? prefix : coordinates.slice(0, 2);
}
