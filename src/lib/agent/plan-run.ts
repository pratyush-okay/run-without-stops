import { bearingDegrees, distanceMeters, offsetPoint, smallestAngleDegrees } from "@/lib/geo";
import type { ScenicPlace } from "@/lib/osm/scenic";
import { DEFAULT_PACE_SECONDS_PER_KM, formatDistance, type MetricUnit } from "@/lib/routing/format";
import { closeRouteLoop } from "@/lib/routing/points";
import type { AgentIncludedPlace, AgentRouteProposal } from "@/lib/schemas/agent";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteMode } from "@/lib/schemas/route";

export const DEFAULT_LOOP_METERS = 5_000;
export const MIN_LOOP_METERS = 800;
export const MAX_LOOP_METERS = 42_000;
const STREET_FACTOR = 1.22;
const VIA_DEDUPE_METERS = 80;

export type NamedVia = {
  point: GeoPoint;
  name: string;
};

export type LoopIntent = {
  origin: GeoPoint;
  distanceKm?: number;
  distanceMiles?: number;
  durationMinutes?: number;
  unit?: MetricUnit;
  paceSecondsPerKm?: number;
  includePark?: boolean;
  includeLake?: boolean;
  includeWater?: boolean;
  namedPlaces?: NamedVia[];
  places?: ScenicPlace[];
  mode?: RouteMode;
  avoidElevation?: boolean;
  waterHalfway?: boolean;
};

export function normalizeDistanceKm(value: number) {
  if (value > 42 && value <= MAX_LOOP_METERS) return value / 1_000;
  return value;
}

export function inferLoopHints(text: string) {
  const km = text.match(/(\d+(?:\.\d+)?)\s*k(?:m)?\b/i);
  const miles = text.match(/(\d+(?:\.\d+)?)\s*(?:mi|miles?)\b/i);
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:min|minutes?)\b/i);
  const includeWater =
    /\b(water(?:\s+points?|\s+breaks?|\s+stops?)?|drinking water|fountains?|refill)\b/i.test(text);
  const waterHalfway = /\b(half(?:\s|-)?way|mid(?:\s|-)?way|in the middle)\b/i.test(text);
  return {
    ...(km ? { distanceKm: normalizeDistanceKm(Number(km[1])) } : {}),
    ...(!km && miles ? { distanceMiles: Number(miles[1]) } : {}),
    ...(minutes ? { durationMinutes: Number(minutes[1]) } : {}),
    ...(/\bparks?\b/i.test(text) ? { includePark: true } : {}),
    ...(/\blakes?\b|\bponds?\b/i.test(text) ? { includeLake: true } : {}),
    ...(includeWater || waterHalfway ? { includeWater: true } : {}),
    ...(waterHalfway ? { waterHalfway: true } : {}),
  };
}

export function targetMetersFromIntent(input: {
  distanceKm?: number;
  distanceMiles?: number;
  durationMinutes?: number;
  paceSecondsPerKm?: number;
}) {
  const pace = input.paceSecondsPerKm ?? DEFAULT_PACE_SECONDS_PER_KM;
  let meters: number | undefined;
  if (input.distanceKm != null && Number.isFinite(input.distanceKm)) {
    meters = input.distanceKm * 1_000;
  } else if (input.distanceMiles != null && Number.isFinite(input.distanceMiles)) {
    meters = input.distanceMiles * 1_609.344;
  } else if (input.durationMinutes != null && Number.isFinite(input.durationMinutes)) {
    meters = ((input.durationMinutes * 60) / pace) * 1_000;
  }
  if (meters == null) return DEFAULT_LOOP_METERS;
  return Math.min(MAX_LOOP_METERS, Math.max(MIN_LOOP_METERS, meters));
}

export function loopRadiusMeters(targetMeters: number) {
  return targetMeters / (2 * Math.PI * STREET_FACTOR);
}

export function waypointLabelKey(point: GeoPoint) {
  return `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
}

export function selectLoopVias(origin: GeoPoint, targetMeters: number, intent: LoopIntent) {
  const selected: AgentIncludedPlace[] = [];
  const radius = Math.max(1_400, loopRadiusMeters(targetMeters) * 2);

  function unused(kind: ScenicPlace["kind"]) {
    return (intent.places ?? [])
      .filter((place) => place.kind === kind)
      .filter((place) => distanceMeters(origin, place.point) > VIA_DEDUPE_METERS)
      .filter((place) => distanceMeters(origin, place.point) <= radius)
      .filter((place) =>
        selected.every((via) => distanceMeters(via.point, place.point) > VIA_DEDUPE_METERS),
      )
      .sort(
        (left, right) => distanceMeters(origin, left.point) - distanceMeters(origin, right.point),
      );
  }

  for (const named of intent.namedPlaces ?? []) {
    if (distanceMeters(origin, named.point) < VIA_DEDUPE_METERS) continue;
    if (selected.some((via) => distanceMeters(via.point, named.point) < VIA_DEDUPE_METERS))
      continue;
    selected.push({ kind: "place", name: named.name, point: named.point });
  }

  if (intent.includePark) {
    const park = unused("park")[0];
    if (park) selected.push({ kind: "park", name: park.name, point: park.point });
  }
  if (intent.includeLake) {
    const lake = unused("lake")[0];
    if (lake) selected.push({ kind: "lake", name: lake.name, point: lake.point });
  }
  if (intent.includeWater) {
    const halfwayHeading =
      (bearingDegrees(origin, selected[0]?.point ?? offsetPoint(origin, 100, 0)) + 180) % 360;
    const targetRadius = loopRadiusMeters(targetMeters);
    const water = unused("water")
      .map((place) => {
        const heading = bearingDegrees(origin, place.point);
        const angle = intent.waterHalfway ? smallestAngleDegrees(heading, halfwayHeading) : 0;
        const radial = Math.abs(distanceMeters(origin, place.point) - targetRadius);
        return { place, score: radial + angle * 12 };
      })
      .sort((left, right) => left.score - right.score)[0]?.place;
    if (water) selected.push({ kind: "water", name: water.name, point: water.point });
  }

  return selected.slice(0, 6);
}

export function proposeLoopPoints(
  origin: GeoPoint,
  targetMeters: number,
  vias: AgentIncludedPlace[] = [],
) {
  const slotCount = vias.length >= 4 ? 5 : targetMeters < 3_000 ? 3 : 4;
  const radius = loopRadiusMeters(targetMeters);
  const startHeading = vias[0] ? bearingDegrees(origin, vias[0].point) : 0;
  const slots: GeoPoint[] = [];
  for (let index = 0; index < slotCount; index += 1) {
    slots.push(offsetPoint(origin, radius, (startHeading + (360 / slotCount) * index) % 360));
  }

  const used = new Set<number>();
  const knownLabels: Record<string, string> = { [waypointLabelKey(origin)]: "Start" };

  for (const via of vias) {
    let best = -1;
    let bestAngle = Number.POSITIVE_INFINITY;
    const heading = bearingDegrees(origin, via.point);
    for (let index = 0; index < slots.length; index += 1) {
      if (used.has(index)) continue;
      const slotHeading = (startHeading + (360 / slotCount) * index) % 360;
      const angle = smallestAngleDegrees(heading, slotHeading);
      if (angle < bestAngle) {
        bestAngle = angle;
        best = index;
      }
    }
    if (best < 0) continue;
    used.add(best);
    slots[best] = via.point;
    knownLabels[waypointLabelKey(via.point)] = via.name;
  }

  return {
    points: closeRouteLoop([origin, ...slots]),
    knownLabels,
  };
}

export function planRunLoop(intent: LoopIntent): AgentRouteProposal {
  const targetMeters = targetMetersFromIntent(intent);
  const included = selectLoopVias(intent.origin, targetMeters, intent);
  const loop = proposeLoopPoints(intent.origin, targetMeters, included);
  const names = included.map((place) => place.name);
  const viaText = names.length > 0 ? ` via ${names.join(", ")}` : "";
  const unit = intent.unit ?? "metric";

  return {
    ok: true,
    points: loop.points,
    knownLabels: loop.knownLabels,
    mode: intent.mode ?? "low_stops",
    avoidElevation: intent.avoidElevation ?? false,
    targetMeters,
    included,
    summary: `About a ${formatDistance(targetMeters, unit)} loop${viaText}.`,
  };
}
