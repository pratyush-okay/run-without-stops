import {
  clearRouteCache,
  readRouteCache,
  routeRequestKey,
  writeRouteCache,
} from "@/lib/routing/route-cache";
import type { RouteResponse } from "@/lib/schemas/route";

const route = {
  coordinates: [
    [151.2, -33.86],
    [151.21, -33.87],
  ],
  metrics: {
    distanceMeters: 1000,
    durationSeconds: 300,
    trafficSignals: 1,
    crossings: 0,
    majorRoadMeters: 0,
  },
  provider: "graphhopper",
  warnings: [],
} satisfies RouteResponse;

const request = {
  points: [
    { lat: -33.86881, lng: 151.20931 },
    { lat: -33.87, lng: 151.22 },
  ],
  mode: "low_stops" as const,
  avoidElevation: false,
  features: [],
};

describe("route cache", () => {
  beforeEach(() => {
    clearRouteCache();
    vi.useRealTimers();
  });

  it("returns the same line for the same points and mode", () => {
    const key = routeRequestKey(request);
    writeRouteCache(key, route);

    expect(readRouteCache(key)).toBe(route);
    expect(readRouteCache(routeRequestKey({ ...request, mode: "direct" }))).toBeUndefined();
  });

  it("drops a line after five minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T00:00:00Z"));
    const key = routeRequestKey(request);
    writeRouteCache(key, route);
    vi.setSystemTime(new Date("2026-09-22T00:05:01Z"));

    expect(readRouteCache(key)).toBeUndefined();
  });
});
