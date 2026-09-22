import {
  joinRouteLegs,
  legKey,
  matchStoredLegs,
  missingLegIndexes,
  routeGapRequests,
} from "@/lib/routing/join-route-legs";
import type { RouteResponse } from "@/lib/schemas/route";

const start = { lat: -33.86, lng: 151.2 };
const middle = { lat: -33.87, lng: 151.21 };
const end = { lat: -33.88, lng: 151.22 };

function leg(
  coordinates: [number, number][],
  distanceMeters: number,
  extras: Partial<RouteResponse> = {},
): RouteResponse {
  return {
    coordinates,
    metrics: {
      distanceMeters,
      durationSeconds: distanceMeters / 3,
      ascentMeters: 10,
      descentMeters: 4,
      minElevationMeters: 12,
      maxElevationMeters: 30,
      trafficSignals: 1,
      crossings: 2,
      majorRoadMeters: 40,
    },
    elevation: {
      samples: [
        { distanceMeters: 0, elevationMeters: 12 },
        { distanceMeters, elevationMeters: 20 },
      ],
      marks: [
        {
          kind: "climb",
          point: { lat: coordinates[0]?.[1] ?? 0, lng: coordinates[0]?.[0] ?? 0 },
          elevationMeters: 18,
        },
      ],
    },
    provider: "graphhopper",
    warnings: ["Stop counts are unavailable until nearby map data loads."],
    ...extras,
  };
}

describe("joinRouteLegs", () => {
  it("drops the shared joint and shifts elevation by the previous leg", () => {
    const joined = joinRouteLegs([
      leg(
        [
          [151.2, -33.86],
          [151.205, -33.865],
        ],
        800,
      ),
      leg(
        [
          [151.205, -33.865],
          [151.21, -33.87],
        ],
        500,
        {
          metrics: {
            distanceMeters: 500,
            durationSeconds: 160,
            ascentMeters: 6,
            descentMeters: 1,
            minElevationMeters: 8,
            maxElevationMeters: 40,
            trafficSignals: 3,
            crossings: 1,
            majorRoadMeters: 25,
          },
        },
      ),
    ]);

    expect(joined.coordinates).toEqual([
      [151.2, -33.86],
      [151.205, -33.865],
      [151.21, -33.87],
    ]);
    expect(joined.metrics.distanceMeters).toBe(1300);
    expect(joined.metrics.durationSeconds).toBe(800 / 3 + 160);
    expect(joined.metrics.ascentMeters).toBe(16);
    expect(joined.metrics.descentMeters).toBe(5);
    expect(joined.metrics.minElevationMeters).toBe(8);
    expect(joined.metrics.maxElevationMeters).toBe(40);
    expect(joined.metrics.trafficSignals).toBe(4);
    expect(joined.metrics.crossings).toBe(3);
    expect(joined.metrics.majorRoadMeters).toBe(65);
    expect(joined.elevation?.samples.map((sample) => sample.distanceMeters)).toEqual([
      0, 800, 1300,
    ]);
    expect(joined.elevation?.marks).toHaveLength(2);
    expect(joined.warnings).toEqual(["Stop counts are unavailable until nearby map data loads."]);
  });
});

describe("stored legs", () => {
  it("fetches only the new gap when a point is appended", () => {
    const prefix = routeGapRequests([start, middle], "low_stops", false, []);
    const prefixRequest = prefix[0];
    if (!prefixRequest) throw new Error("expected a prefix gap");
    const stored = [
      {
        key: legKey(prefixRequest),
        route: leg(
          [
            [151.2, -33.86],
            [151.21, -33.87],
          ],
          1000,
        ),
      },
    ];
    const next = routeGapRequests([start, middle, end], "low_stops", false, []);
    const ready = matchStoredLegs(stored, next.map(legKey));

    expect(missingLegIndexes(ready)).toEqual([1]);
    expect(next[1]?.points).toEqual([middle, end]);
  });

  it("refetches every gap when the mode changes", () => {
    const lowStops = routeGapRequests([start, middle, end], "low_stops", false, []);
    const stored = lowStops.map((request) => ({
      key: legKey(request),
      route: leg(
        [
          [request.points[0]?.lng ?? 0, request.points[0]?.lat ?? 0],
          [request.points[1]?.lng ?? 0, request.points[1]?.lat ?? 0],
        ],
        100,
      ),
    }));
    const direct = routeGapRequests([start, middle, end], "direct", false, []);
    const ready = matchStoredLegs(stored, direct.map(legKey));

    expect(missingLegIndexes(ready)).toEqual([0, 1]);
    expect(direct).toHaveLength(2);
  });
});
