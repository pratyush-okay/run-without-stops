import { fitRouteResponse, joinRouteLegs, routeGapRequests } from "@/lib/routing/join-route-legs";
import { mapWithConcurrency } from "@/lib/routing/map-pool";
import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

export const LOCATIONS_PER_ROUTING_REQUEST = 2;
export const ROUTE_LEG_CONCURRENCY = 1;

export async function fetchJoinedLegs(
  input: RouteRequest,
  fetchOne: (input: RouteRequest) => Promise<RouteResponse>,
  concurrency = ROUTE_LEG_CONCURRENCY,
) {
  if (input.points.length <= LOCATIONS_PER_ROUTING_REQUEST) {
    return fetchOne(input);
  }

  const gaps = routeGapRequests(input.points, input.mode, input.avoidElevation, input.features);
  const legs = await mapWithConcurrency(gaps, concurrency, (gap) => fetchLeg(gap, fetchOne));
  return fitRouteResponse(joinRouteLegs(legs));
}

async function fetchLeg(
  gap: RouteRequest,
  fetchOne: (input: RouteRequest) => Promise<RouteResponse>,
) {
  try {
    return await fetchOne(gap);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fetchOne(gap);
  }
}
