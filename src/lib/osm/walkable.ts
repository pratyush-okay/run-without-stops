import { distanceMeters } from "@/lib/geo";
import { overpassPoint, queryOverpass } from "@/lib/osm/overpass";
import { isRouteLoop } from "@/lib/routing/points";
import type { GeoPoint } from "@/lib/schemas/features";

const WALKABLE_HIGHWAYS =
  "^(footway|path|pedestrian|steps|living_street|residential|unclassified|tertiary|cycleway|service|track)$";
const SNAP_RADIUS_METERS = 420;
const MIN_VIA_SEPARATION_METERS = 70;

function walkableQuery(origin: GeoPoint, radiusMeters: number) {
  const around = `around:${Math.round(radiusMeters)},${origin.lat},${origin.lng}`;
  return `[out:json][timeout:12][maxsize:16777216];
way["highway"~"${WALKABLE_HIGHWAYS}"](${around});
out center;`;
}

export function nearestWalkable(
  target: GeoPoint,
  candidates: readonly GeoPoint[],
  used: ReadonlySet<number> = new Set(),
  maxMeters = SNAP_RADIUS_METERS,
) {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < candidates.length; index += 1) {
    if (used.has(index)) continue;
    const candidate = candidates[index];
    if (!candidate) continue;
    const distance = distanceMeters(target, candidate);
    if (distance > maxMeters || distance >= bestDistance) continue;
    best = index;
    bestDistance = distance;
  }
  return best < 0 ? undefined : { index: best, point: candidates[best] as GeoPoint };
}

export async function snapLoopPoints(points: GeoPoint[]): Promise<GeoPoint[]> {
  if (points.length === 0) return points;
  const origin = points[0];
  if (!origin) return points;
  const reach =
    Math.max(SNAP_RADIUS_METERS, ...points.map((point) => distanceMeters(origin, point))) +
    SNAP_RADIUS_METERS;
  const elements = await queryOverpass(walkableQuery(origin, reach));
  const candidates: GeoPoint[] = [];
  for (const element of elements) {
    const point = overpassPoint(element);
    if (point) candidates.push(point);
  }
  if (candidates.length === 0) return points;

  const open = isRouteLoop(points) ? points.slice(0, -1) : points;
  const used = new Set<number>();
  const snapped: GeoPoint[] = [];
  for (const target of open) {
    const blocked = new Set(used);
    let chosen: GeoPoint | undefined;
    while (!chosen) {
      const match = nearestWalkable(target, candidates, blocked);
      if (!match) break;
      if (snapped.some((point) => distanceMeters(point, match.point) < MIN_VIA_SEPARATION_METERS)) {
        blocked.add(match.index);
        continue;
      }
      used.add(match.index);
      chosen = match.point;
    }
    snapped.push(chosen ?? target);
  }

  if (snapped.length < 2) return points;
  return isRouteLoop(points) ? [...snapped, snapped[0] as GeoPoint] : snapped;
}
