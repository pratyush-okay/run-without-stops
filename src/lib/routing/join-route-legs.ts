import { featuresForGap } from "@/lib/geo";
import { routeRequestKey } from "@/lib/routing/route-cache";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import type { RouteMode, RouteResponse } from "@/lib/schemas/route";

const MAX_ELEVATION_SAMPLES = 240;
const MAX_ELEVATION_MARKS = 40;

export type StoredLeg = {
  key: string;
  route: RouteResponse;
};

type LegRequest = {
  points: GeoPoint[];
  mode: RouteMode;
  avoidElevation: boolean;
  features: RunnerFeature[];
};

export function routeGapRequests(
  points: readonly GeoPoint[],
  mode: RouteMode,
  avoidElevation: boolean,
  features: RunnerFeature[],
): LegRequest[] {
  const gaps: LegRequest[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (!from || !to) continue;
    gaps.push({
      points: [from, to],
      mode,
      avoidElevation,
      features: featuresForGap(features, from, to),
    });
  }
  return gaps;
}

export function matchStoredLegs(stored: readonly StoredLeg[], keys: readonly string[]) {
  const byKey = new Map(stored.map((leg) => [leg.key, leg.route]));
  return keys.map((key) => byKey.get(key));
}

export function missingLegIndexes(legs: readonly (RouteResponse | undefined)[]) {
  const missing: number[] = [];
  legs.forEach((leg, index) => {
    if (!leg) missing.push(index);
  });
  return missing;
}

export function joinReadyPrefix(legs: readonly (RouteResponse | undefined)[]) {
  const ready: RouteResponse[] = [];
  for (const leg of legs) {
    if (!leg) break;
    ready.push(leg);
  }
  return ready.length > 0 ? joinRouteLegs(ready) : undefined;
}

export function joinRouteLegs(legs: readonly RouteResponse[]): RouteResponse {
  const first = legs[0];
  if (!first) {
    throw new Error("A route needs at least one leg");
  }
  if (legs.length === 1) return first;

  const coordinates: [number, number][] = [];
  for (const leg of legs) {
    const next = coordinates.length === 0 ? leg.coordinates : leg.coordinates.slice(1);
    coordinates.push(...next);
  }

  const distanceMeters = legs.reduce((total, leg) => total + leg.metrics.distanceMeters, 0);
  const durationSeconds = legs.reduce((total, leg) => total + leg.metrics.durationSeconds, 0);
  const ascent = sumOptional(legs, (leg) => leg.metrics.ascentMeters);
  const descent = sumOptional(legs, (leg) => leg.metrics.descentMeters);
  const minElevation = minOptional(legs, (leg) => leg.metrics.minElevationMeters);
  const maxElevation = maxOptional(legs, (leg) => leg.metrics.maxElevationMeters);
  const drinkingWater = sumOptional(legs, (leg) => leg.metrics.drinkingWater);
  const elevation = joinElevation(legs);

  return fitRouteResponse({
    coordinates,
    metrics: {
      distanceMeters,
      durationSeconds,
      trafficSignals: legs.reduce((total, leg) => total + leg.metrics.trafficSignals, 0),
      crossings: legs.reduce((total, leg) => total + leg.metrics.crossings, 0),
      majorRoadMeters: legs.reduce((total, leg) => total + leg.metrics.majorRoadMeters, 0),
      ...(ascent === undefined ? {} : { ascentMeters: ascent }),
      ...(descent === undefined ? {} : { descentMeters: descent }),
      ...(minElevation === undefined ? {} : { minElevationMeters: minElevation }),
      ...(maxElevation === undefined ? {} : { maxElevationMeters: maxElevation }),
      ...(drinkingWater === undefined ? {} : { drinkingWater }),
    },
    ...(elevation ? { elevation } : {}),
    provider: legs.every((leg) => leg.provider === first.provider) ? first.provider : "graphhopper",
    warnings: [...new Set(legs.flatMap((leg) => leg.warnings))].slice(0, 20),
  });
}

export function legKey(request: LegRequest) {
  return routeRequestKey(request);
}

function joinElevation(legs: readonly RouteResponse[]) {
  if (legs.some((leg) => !leg.elevation)) return undefined;
  let offset = 0;
  const samples = legs.flatMap((leg, index) => {
    const shifted = (leg.elevation?.samples ?? [])
      .filter((sample) => index === 0 || sample.distanceMeters > 0)
      .map((sample) => ({
        ...sample,
        distanceMeters: sample.distanceMeters + offset,
      }));
    offset += leg.metrics.distanceMeters;
    return shifted;
  });
  const marks = legs.flatMap((leg) => leg.elevation?.marks ?? []);
  if (samples.length < 2) return undefined;
  return { samples, marks };
}

function sumOptional(
  legs: readonly RouteResponse[],
  read: (leg: RouteResponse) => number | undefined,
) {
  const values = legs.map(read).filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;
  return values.reduce((total, value) => total + value, 0);
}

function minOptional(
  legs: readonly RouteResponse[],
  read: (leg: RouteResponse) => number | undefined,
) {
  const values = legs.map(read).filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;
  return Math.min(...values);
}

function maxOptional(
  legs: readonly RouteResponse[],
  read: (leg: RouteResponse) => number | undefined,
) {
  const values = legs.map(read).filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;
  return Math.max(...values);
}

export function fitRouteResponse(route: RouteResponse): RouteResponse {
  const elevation = route.elevation;
  if (!elevation) return route;
  if (
    elevation.samples.length <= MAX_ELEVATION_SAMPLES &&
    elevation.marks.length <= MAX_ELEVATION_MARKS
  ) {
    return route;
  }
  return {
    ...route,
    elevation: {
      samples: downsample(elevation.samples, MAX_ELEVATION_SAMPLES),
      marks: elevation.marks.slice(0, MAX_ELEVATION_MARKS),
    },
  };
}

function downsample<T>(items: readonly T[], max: number) {
  if (items.length <= max) return [...items];
  const last = items.length - 1;
  const picked: T[] = [];
  for (let index = 0; index < max; index += 1) {
    const source = Math.round((index * last) / (max - 1));
    const item = items[source];
    if (item !== undefined) picked.push(item);
  }
  return picked;
}
