import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 48;

const entries = new Map<string, { at: number; route: RouteResponse }>();

export function routeRequestKey(
  input: Pick<RouteRequest, "points" | "mode" | "avoidElevation" | "features">,
) {
  const points = input.points
    .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
    .join(";");
  const features = input.features
    .filter((feature) => feature.kind === "traffic_signal" || feature.kind === "crossing")
    .map(
      (feature) =>
        `${feature.kind}:${feature.point.lat.toFixed(4)},${feature.point.lng.toFixed(4)}`,
    )
    .sort()
    .join("|");
  return `${input.mode}:${input.avoidElevation ? "1" : "0"}:${points}:${features}`;
}

export function readRouteCache(key: string) {
  const entry = entries.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > TTL_MS) {
    entries.delete(key);
    return undefined;
  }
  entries.delete(key);
  entries.set(key, entry);
  return entry.route;
}

export function writeRouteCache(key: string, route: RouteResponse) {
  entries.set(key, { at: Date.now(), route });
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

export function clearRouteCache() {
  entries.clear();
}
