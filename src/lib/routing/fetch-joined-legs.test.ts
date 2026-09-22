import { fetchJoinedLegs } from "@/lib/routing/fetch-joined-legs";
import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

function gapRoute(input: RouteRequest): RouteResponse {
  const from = input.points[0];
  const to = input.points[1];
  if (!from || !to) throw new Error("expected two points");
  return {
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
    metrics: {
      distanceMeters: 100,
      durationSeconds: 40,
      trafficSignals: 0,
      crossings: 0,
      majorRoadMeters: 0,
    },
    provider: "graphhopper",
    warnings: [],
  };
}

describe("fetchJoinedLegs", () => {
  it("never sends more than two locations for a long line", async () => {
    const points = Array.from({ length: 8 }, (_, index) => ({
      lat: -33.86 - index * 0.002,
      lng: 151.2 + index * 0.001,
    }));
    const sizes: number[] = [];

    const route = await fetchJoinedLegs(
      { points, mode: "direct", avoidElevation: false, features: [] },
      async (gap) => {
        sizes.push(gap.points.length);
        return gapRoute(gap);
      },
    );

    expect(sizes).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(route.metrics.distanceMeters).toBe(700);
    expect(route.coordinates).toHaveLength(8);
  });
});
