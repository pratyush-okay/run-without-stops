import { distanceMeters } from "@/lib/geo";
import type { GeoPoint } from "@/lib/schemas/features";

export const MAX_ROUTE_STOPS = 50;
export const MAX_ROUTE_POINTS = MAX_ROUTE_STOPS + 1;
export const MINIMUM_STOP_SPACING_METERS = 2;
export const LOOP_SNAP_METERS = 60;

function isNearStart(start: GeoPoint | undefined, point: GeoPoint) {
  return Boolean(start && distanceMeters(start, point) < LOOP_SNAP_METERS);
}

function uniqueStops(points: GeoPoint[]) {
  return isRouteLoop(points) ? points.slice(0, -1) : points;
}

export function addRoutePoint(points: GeoPoint[], point: GeoPoint, maxStops = MAX_ROUTE_STOPS) {
  const stops = uniqueStops(points);
  const isDuplicate = stops.some(
    (current) => distanceMeters(current, point) < MINIMUM_STOP_SPACING_METERS,
  );
  if (isDuplicate) return points;
  if (stops.length >= 2 && isNearStart(stops[0], point)) {
    return closeRouteLoop(stops, maxStops);
  }
  if (stops.length >= maxStops) return points;
  const next = [...stops, point];
  return isRouteLoop(points) ? closeRouteLoop(next, maxStops) : next;
}

export function insertRoutePoint(points: GeoPoint[], gapIndex: number, point: GeoPoint) {
  if (gapIndex < 0 || gapIndex >= points.length - 1) return points;
  const stops = uniqueStops(points);
  if (stops.length >= MAX_ROUTE_STOPS) return points;
  const duplicate = points.some(
    (current) => distanceMeters(current, point) < MINIMUM_STOP_SPACING_METERS,
  );
  if (duplicate) return points;
  return [...points.slice(0, gapIndex + 1), point, ...points.slice(gapIndex + 1)];
}

export function removeRoutePoint(points: GeoPoint[], index: number) {
  if (index < 0 || index >= points.length) return points;
  if (isRouteLoop(points)) {
    if (index === 0) return points.slice(1, -1);
    if (index === points.length - 1) return points.slice(0, -1);
  }
  return points.filter((_, currentIndex) => currentIndex !== index);
}

export function moveRoutePoint(points: GeoPoint[], index: number, point: GeoPoint) {
  if (!points[index]) return points;
  const loop = isRouteLoop(points);
  const lastIndex = points.length - 1;
  const overlapsAnotherPoint = points.some((currentPoint, currentIndex) => {
    if (currentIndex === index) return false;
    if (
      loop &&
      ((index === 0 && currentIndex === lastIndex) || (index === lastIndex && currentIndex === 0))
    ) {
      return false;
    }
    return distanceMeters(currentPoint, point) < MINIMUM_STOP_SPACING_METERS;
  });
  if (overlapsAnotherPoint) return points;
  if (!loop && index === lastIndex && points.length >= 3 && isNearStart(points[0], point)) {
    return closeRouteLoop(points.slice(0, -1));
  }
  return points.map((currentPoint, currentIndex) => {
    if (currentIndex === index) return point;
    if (loop && index === 0 && currentIndex === lastIndex) return point;
    if (loop && index === lastIndex && currentIndex === 0) return point;
    return currentPoint;
  });
}

export function reverseRoutePoints(points: GeoPoint[]) {
  return [...points].reverse();
}

export function isRouteLoop(points: GeoPoint[]) {
  const start = points[0];
  const finish = points.at(-1);
  if (!start || !finish || points.length < 3) return false;
  return distanceMeters(start, finish) < MINIMUM_STOP_SPACING_METERS;
}

export function closeRouteLoop(points: GeoPoint[], maxStops = MAX_ROUTE_STOPS) {
  const start = points[0];
  if (!start || points.length < 2 || isRouteLoop(points) || points.length > maxStops) {
    return points;
  }
  return [...points, start];
}
