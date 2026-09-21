import { realizeLoopRoute } from "@/lib/agent/realize-route";
import type { AgentRouteProposal } from "@/lib/schemas/agent";
import type { RouteResponse } from "@/lib/schemas/route";

const proposal: AgentRouteProposal = {
  ok: true,
  points: [
    { lat: -33.8688, lng: 151.2093 },
    { lat: -33.875, lng: 151.2093 },
    { lat: -33.8688, lng: 151.216 },
    { lat: -33.862, lng: 151.2093 },
    { lat: -33.8688, lng: 151.2093 },
  ],
  knownLabels: { "-33.86880,151.20930": "Start" },
  mode: "low_stops",
  avoidElevation: false,
  targetMeters: 6_000,
  summary: "About a 6.00 km loop.",
  included: [],
};

const route: RouteResponse = {
  coordinates: [
    [151.2093, -33.8688],
    [151.216, -33.8688],
    [151.2093, -33.8688],
  ],
  metrics: {
    distanceMeters: 6_120,
    durationSeconds: 2_000,
    trafficSignals: 0,
    crossings: 0,
    majorRoadMeters: 0,
  },
  provider: "graphhopper",
  warnings: [],
};

describe("realizeLoopRoute", () => {
  it("snaps waypoints and attaches a computed street route", async () => {
    const snapped = proposal.points.map((point) => ({
      lat: point.lat + 0.0002,
      lng: point.lng,
    }));
    const result = await realizeLoopRoute(proposal, {
      snapLoopPoints: async () => snapped,
      fetchRoute: async (input) => {
        expect(input.mode).toBe("low_stops");
        return route;
      },
    });

    expect(result.points[0]).toEqual(snapped[0]);
    expect(result.route?.metrics.distanceMeters).toBe(6_120);
  });

  it("falls back to direct routing when low-stops fails", async () => {
    const result = await realizeLoopRoute(proposal, {
      snapLoopPoints: async (points) => points,
      fetchRoute: async (input) => {
        if (input.mode === "low_stops") throw new Error("Cannot find point");
        return route;
      },
    });

    expect(result.mode).toBe("direct");
    expect(result.route).toEqual(route);
  });
});
