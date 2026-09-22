import { distanceMeters } from "@/lib/geo";
import type { GeoPoint } from "@/lib/schemas/features";

const STOP_SNAP_METERS = 80;

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

function anchorIndex(point: GeoPoint, coordinates: [number, number][], searchFrom: number) {
  let nearest = searchFrom;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = searchFrom; index < coordinates.length; index += 1) {
    const coordinate = coordinates[index];
    if (!coordinate) continue;
    const delta = distanceMeters(point, { lat: coordinate[1], lng: coordinate[0] });
    if (delta <= STOP_SNAP_METERS) return index;
    if (delta < nearestDistance) {
      nearestDistance = delta;
      nearest = index;
    }
  }
  return nearest;
}

export function gapIndexOnRoute(
  points: readonly GeoPoint[],
  coordinates: readonly [number, number][],
  alongMeters: number,
) {
  if (points.length < 2 || coordinates.length < 2) return undefined;
  const distances = cumulativeDistances([...coordinates]);
  const anchors: number[] = [];
  let searchFrom = 0;
  for (const point of points) {
    const index = anchorIndex(point, [...coordinates], searchFrom);
    anchors.push(distances[index] ?? 0);
    searchFrom = index;
  }

  for (let gap = 0; gap < anchors.length - 1; gap += 1) {
    const start = anchors[gap] ?? 0;
    const end = anchors[gap + 1] ?? start;
    const lastGap = gap === anchors.length - 2;
    if (alongMeters >= start && (lastGap ? alongMeters <= end : alongMeters < end)) return gap;
  }

  return undefined;
}
