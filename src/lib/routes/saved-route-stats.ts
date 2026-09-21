import {
  displayPaceSeconds,
  durationFromPace,
  formatDistance,
  formatEffortDuration,
  formatElevation,
  formatPace,
  type MetricUnit,
  paceUnitLabel,
} from "@/lib/routing/format";
import type { SavedRouteSummary } from "@/lib/schemas/saved-route";

export function savedRouteStatLine(route: SavedRouteSummary, unit: MetricUnit) {
  const parts = [
    formatDistance(route.distanceMeters, unit),
    route.mode === "low_stops" ? "Low stops" : "Direct",
  ];

  if (route.paceSecondsPerKm !== undefined) {
    parts.push(
      `${formatPace(displayPaceSeconds(route.paceSecondsPerKm, unit))}${paceUnitLabel(unit)}`,
      formatEffortDuration(durationFromPace(route.distanceMeters, route.paceSecondsPerKm)),
    );
  }
  if (route.ascentMeters !== undefined) {
    parts.push(`${formatElevation(route.ascentMeters, unit)} gain`);
  }
  if (route.descentMeters !== undefined) {
    parts.push(`${formatElevation(route.descentMeters, unit)} loss`);
  }

  parts.push(
    `${route.trafficSignals} ${route.trafficSignals === 1 ? "light" : "lights"}`,
    `${route.crossings} ${route.crossings === 1 ? "crossing" : "crossings"}`,
  );
  if (route.drinkingWater !== undefined) parts.push(`${route.drinkingWater} water`);
  parts.push(`${formatDistance(route.majorRoadMeters, unit)} major`);
  return parts.join(" · ");
}
