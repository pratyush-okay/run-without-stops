import {
  type RouteMetrics,
  type RouteResponse,
  routeElevationSchema,
  routeMetricsSchema,
} from "@/lib/schemas/route";

const storedMetricsSchema = routeMetricsSchema.extend({
  elevation: routeElevationSchema.optional(),
});

export function routeWithDisplayedMetrics(
  route: RouteResponse,
  counts: Pick<RouteMetrics, "trafficSignals" | "crossings" | "drinkingWater">,
  paceSecondsPerKm: number,
): RouteResponse {
  return {
    ...route,
    metrics: {
      ...route.metrics,
      trafficSignals: counts.trafficSignals,
      crossings: counts.crossings,
      ...(counts.drinkingWater === undefined ? {} : { drinkingWater: counts.drinkingWater }),
      paceSecondsPerKm,
    },
  };
}

export function metricsForStorage(route: RouteResponse) {
  return {
    ...route.metrics,
    ...(route.elevation ? { elevation: route.elevation } : {}),
  };
}

export function routePartsFromStoredMetrics(stored: unknown) {
  const parsed = storedMetricsSchema.parse(stored);
  const { elevation, ...metrics } = parsed;
  return {
    metrics,
    ...(elevation ? { elevation } : {}),
  };
}
