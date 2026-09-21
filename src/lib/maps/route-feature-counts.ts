import { featuresNearRoute } from "@/lib/geo";
import { pairWaypointFeatures } from "@/lib/maps/combined-markers";
import { visibleWaypoints } from "@/lib/routing/waypoints";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";

export function displayedRouteFeatureCounts(
  features: RunnerFeature[],
  route: GeoPoint[],
  layers?: Partial<Record<RunnerFeature["kind"], boolean>>,
  points: GeoPoint[] = [],
) {
  const enabled = layers ? features.filter((feature) => layers[feature.kind]) : features;
  const visible = featuresNearRoute(enabled, route);
  const { combined, leftoverFeatures } = pairWaypointFeatures(visibleWaypoints(points), visible);
  const drawn = (kind: RunnerFeature["kind"]) =>
    leftoverFeatures.filter((feature) => feature.kind === kind).length +
    combined.filter((mark) => mark.feature?.kind === kind).length;

  return {
    trafficSignals: drawn("traffic_signal"),
    crossings: drawn("crossing"),
    drinkingWater: drawn("drinking_water"),
  };
}
