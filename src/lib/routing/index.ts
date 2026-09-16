import { env } from "@/env";
import { fetchRoute } from "@/lib/routing/graphhopper";
import { fetchValhallaRoute } from "@/lib/routing/valhalla";
import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

let graphHopperCustomRoutingSupported: boolean | undefined;

export async function fetchBestRoute(input: RouteRequest): Promise<RouteResponse> {
  if (
    !env.GRAPHHOPPER_API_KEY ||
    (input.mode === "low_stops" && graphHopperCustomRoutingSupported === false)
  ) {
    return fetchValhallaRoute(input);
  }

  try {
    const route = await fetchRoute(input);
    if (input.mode === "low_stops") graphHopperCustomRoutingSupported = true;
    return route;
  } catch (error) {
    const isUnsupportedFreePlan =
      input.mode === "low_stops" &&
      error instanceof Error &&
      error.message.includes("Free packages cannot use flexible mode");

    if (!isUnsupportedFreePlan) throw error;

    graphHopperCustomRoutingSupported = false;
    const fallback = await fetchValhallaRoute(input);
    return {
      ...fallback,
      warnings: [
        "Low-stops custom routing requires a paid GraphHopper plan; using public Valhalla.",
      ],
    };
  }
}
