import { distanceMeters } from "@/lib/geo";
import type { GeoPoint } from "@/lib/schemas/features";

export const MAX_ROUTE_STOPS = 10;
export const MINIMUM_STOP_SPACING_METERS = 2;

export function addRoutePoint(points: GeoPoint[], point: GeoPoint, maxStops = MAX_ROUTE_STOPS) {
  const isDuplicate = points.some(
    (current) => distanceMeters(current, point) < MINIMUM_STOP_SPACING_METERS,
  );
  return points.length < maxStops && !isDuplicate ? [...points, point] : points;
}

export function removeRoutePoint(points: GeoPoint[], index: number) {
  return points.filter((_, currentIndex) => currentIndex !== index);
}

export function reverseRoutePoints(points: GeoPoint[]) {
  return [...points].reverse();
}

export function isRouteLoop(points: GeoPoint[]) {
  const start = points[0];
  const finish = points.at(-1);
  if (!start || !finish || points.length < 2) return false;
  return distanceMeters(start, finish) < MINIMUM_STOP_SPACING_METERS;
}

export function closeRouteLoop(points: GeoPoint[], maxStops = MAX_ROUTE_STOPS) {
  const start = points[0];
  if (!start || points.length < 2 || points.length >= maxStops || isRouteLoop(points)) {
    return points;
  }
  return [...points, start];
}
