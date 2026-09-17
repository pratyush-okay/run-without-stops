import { distanceMeters } from "@/lib/geo";
import type { WaypointMark } from "@/lib/routing/waypoints";
import type { RunnerFeature } from "@/lib/schemas/features";

export const COMBINED_MARK_METERS = 26;
export const TERMINAL_CLEAR_METERS = 40;

export type CombinedFeatureKind = Extract<RunnerFeature["kind"], "traffic_signal" | "crossing">;

export type CombinedFeature = RunnerFeature & { kind: CombinedFeatureKind };

export type CombinedMark = {
  waypoint: WaypointMark;
  feature?: CombinedFeature;
  extras: CombinedFeature[];
};

function isCombinable(feature: RunnerFeature): feature is CombinedFeature {
  return feature.kind === "traffic_signal" || feature.kind === "crossing";
}

export function pairWaypointFeatures(
  waypoints: WaypointMark[],
  features: RunnerFeature[],
): {
  combined: CombinedMark[];
  leftoverFeatures: RunnerFeature[];
} {
  const candidates: Array<{
    waypoint: WaypointMark;
    feature: CombinedFeature;
    distance: number;
  }> = [];

  for (const waypoint of waypoints) {
    if (waypoint.role !== "via") continue;
    for (const feature of features) {
      if (!isCombinable(feature)) continue;
      const distance = distanceMeters(waypoint.point, feature.point);
      if (distance > COMBINED_MARK_METERS) continue;
      candidates.push({ waypoint, feature, distance });
    }
  }

  candidates.sort((first, second) => {
    const kindRank =
      Number(first.feature.kind === "crossing") - Number(second.feature.kind === "crossing");
    if (kindRank !== 0) return kindRank;
    return first.distance - second.distance;
  });

  const usedWaypoints = new Set<number>();
  const usedFeatures = new Set<string>();
  const combined: CombinedMark[] = [];

  for (const candidate of candidates) {
    if (usedWaypoints.has(candidate.waypoint.index) || usedFeatures.has(candidate.feature.id)) {
      continue;
    }
    usedWaypoints.add(candidate.waypoint.index);
    usedFeatures.add(candidate.feature.id);
    combined.push({ waypoint: candidate.waypoint, feature: candidate.feature, extras: [] });
  }

  for (const mark of combined) {
    if (mark.waypoint.role !== "via") continue;
    for (const feature of features) {
      if (!isCombinable(feature) || usedFeatures.has(feature.id)) continue;
      if (distanceMeters(mark.waypoint.point, feature.point) > COMBINED_MARK_METERS) continue;
      usedFeatures.add(feature.id);
      mark.extras.push(feature);
    }
  }

  for (const waypoint of waypoints) {
    if (waypoint.role === "via") continue;
    for (const feature of features) {
      if (!isCombinable(feature) || usedFeatures.has(feature.id)) continue;
      if (distanceMeters(waypoint.point, feature.point) > TERMINAL_CLEAR_METERS) continue;
      usedFeatures.add(feature.id);
    }
  }

  for (const waypoint of waypoints) {
    if (waypoint.role !== "start_finish" || usedWaypoints.has(waypoint.index)) continue;
    usedWaypoints.add(waypoint.index);
    combined.push({ waypoint, extras: [] });
  }

  return {
    combined,
    leftoverFeatures: features.filter((feature) => !usedFeatures.has(feature.id)),
  };
}

export function combinedIconId(role: WaypointMark["role"], kind?: CombinedFeatureKind) {
  return kind ? `runner-combined-${role}-${kind}` : `runner-combined-${role}`;
}
