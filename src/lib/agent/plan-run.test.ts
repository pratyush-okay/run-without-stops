import {
  inferLoopHints,
  normalizeDistanceKm,
  planRunLoop,
  proposeLoopPoints,
  targetMetersFromIntent,
} from "@/lib/agent/plan-run";
import { executePlanRun } from "@/lib/agent/tools";
import type { ScenicPlace } from "@/lib/osm/scenic";
import { DEFAULT_PACE_SECONDS_PER_KM } from "@/lib/routing/format";
import { closeRouteLoop, isRouteLoop } from "@/lib/routing/points";
import type { GeoPoint } from "@/lib/schemas/features";

const origin: GeoPoint = { lat: -33.8688, lng: 151.2093 };

const hydePark: ScenicPlace = {
  id: "park/1",
  kind: "park",
  name: "Hyde Park",
  point: { lat: -33.8731, lng: 151.2113 },
};

const lake: ScenicPlace = {
  id: "lake/1",
  kind: "lake",
  name: "Duck Pond",
  point: { lat: -33.872, lng: 151.215 },
};

const fountain: ScenicPlace = {
  id: "water/1",
  kind: "water",
  name: "Drinking water",
  point: { lat: -33.87, lng: 151.206 },
};

describe("targetMetersFromIntent", () => {
  it("defaults to 5 km and converts time, km, and miles", () => {
    expect(targetMetersFromIntent({})).toBe(5_000);
    expect(targetMetersFromIntent({ distanceKm: 8 })).toBe(8_000);
    expect(Math.round(targetMetersFromIntent({ distanceMiles: 3 }))).toBe(4_828);
    expect(Math.round(targetMetersFromIntent({ durationMinutes: 30, paceSecondsPerKm: 330 }))).toBe(
      5_455,
    );
    expect(targetMetersFromIntent({ distanceKm: 0.2 })).toBe(800);
    expect(targetMetersFromIntent({ distanceKm: 80 })).toBe(42_000);
  });
});

describe("inferLoopHints", () => {
  it("reads 6k, parks, and minutes from natural language", () => {
    expect(inferLoopHints("Make a 6k loop around me")).toEqual({ distanceKm: 6 });
    expect(normalizeDistanceKm(6_000)).toBe(6);
    expect(inferLoopHints("30 min with a park and water points")).toMatchObject({
      durationMinutes: 30,
      includePark: true,
      includeWater: true,
    });
    expect(
      inferLoopHints("I want a 6k loop around me with a park and 1 water break half way"),
    ).toEqual({
      distanceKm: 6,
      includePark: true,
      includeWater: true,
      waterHalfway: true,
    });
  });
});

describe("proposeLoopPoints", () => {
  it("closes a loop around the origin and pins a park onto a via", () => {
    const loop = proposeLoopPoints(origin, 5_000, [
      { kind: "park", name: "Hyde Park", point: hydePark.point },
    ]);

    expect(isRouteLoop(loop.points)).toBe(true);
    expect(loop.points[0]).toEqual(origin);
    expect(loop.points.some((point) => point.lat === hydePark.point.lat)).toBe(true);
    expect(
      loop.knownLabels[`${hydePark.point.lat.toFixed(5)},${hydePark.point.lng.toFixed(5)}`],
    ).toBe("Hyde Park");
  });
});

describe("planRunLoop", () => {
  it("smartly adds a park, lake, and water point onto an around-me loop", () => {
    const planned = planRunLoop({
      origin,
      durationMinutes: 30,
      paceSecondsPerKm: DEFAULT_PACE_SECONDS_PER_KM,
      includePark: true,
      includeLake: true,
      includeWater: true,
      places: [hydePark, lake, fountain],
    });

    expect(planned.ok).toBe(true);
    expect(planned.mode).toBe("low_stops");
    expect(closeRouteLoop(planned.points)).toEqual(planned.points);
    expect(planned.included.map((place) => place.kind).sort()).toEqual(["lake", "park", "water"]);
    expect(planned.summary).toMatch(/Hyde Park/);
  });

  it("pins one halfway water stop opposite the start", () => {
    const nearStart: ScenicPlace = {
      id: "water/near",
      kind: "water",
      name: "Near tap",
      point: { lat: -33.8692, lng: 151.209 },
    };
    const farSide: ScenicPlace = {
      id: "water/far",
      kind: "water",
      name: "Halfway tap",
      point: { lat: -33.8615, lng: 151.2093 },
    };
    const planned = planRunLoop({
      origin,
      distanceKm: 6,
      includePark: true,
      includeWater: true,
      waterHalfway: true,
      places: [hydePark, nearStart, farSide],
    });

    expect(planned.included.filter((place) => place.kind === "water")).toHaveLength(1);
    expect(planned.included.some((place) => place.name === "Halfway tap")).toBe(true);
  });
});

describe("executePlanRun", () => {
  it("geocodes named places and applies them to the loop", async () => {
    const result = await executePlanRun(
      { namedPlaces: ["Hyde Park"], includePark: true, distanceKm: 6 },
      { location: origin, unit: "metric" },
      {
        realize: false,
        deps: {
          searchPlaces: async () => [{ id: "1", label: "Hyde Park", point: hydePark.point }],
          findScenicPlaces: async () => [hydePark, fountain],
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.targetMeters).toBe(6_000);
    expect(result.included.some((place) => place.name === "Hyde Park")).toBe(true);
  });

  it("starts a named-place loop when GPS is missing", async () => {
    const result = await executePlanRun(
      { namedPlaces: ["Hyde Park"], distanceKm: 4 },
      {},
      {
        realize: false,
        deps: {
          searchPlaces: async () => [{ id: "1", label: "Hyde Park", point: hydePark.point }],
          findScenicPlaces: async () => [],
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.points[0]).toEqual(hydePark.point);
  });

  it("builds an around-me 6k loop from the user text when GPS is missing", async () => {
    const result = await executePlanRun(
      {},
      { mapCenter: origin, unit: "metric" },
      {
        realize: false,
        deps: {
          searchPlaces: async () => [],
          findScenicPlaces: async () => [],
        },
        userText: "Make a 6k loop around me",
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.targetMeters).toBe(6_000);
    expect(result.points[0]).toEqual(origin);
  });

  it("falls back to a default origin when there is no location", async () => {
    const result = await executePlanRun(
      { distanceKm: 5 },
      {},
      {
        realize: false,
        deps: {
          searchPlaces: async () => [],
          findScenicPlaces: async () => [],
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.points[0]).toEqual({ lat: -33.8688, lng: 151.2093 });
  });

  it("still builds a park loop when scenic search fails", async () => {
    const result = await executePlanRun(
      { includePark: true, distanceKm: 6 },
      { mapCenter: origin, unit: "metric" },
      {
        realize: false,
        deps: {
          searchPlaces: async () => [],
          findScenicPlaces: async () => {
            throw new Error("overpass down");
          },
        },
        userText: "Make a 6k loop around me\nI want to include a park as well",
      },
    );

    expect(result.ok).toBe(true);
    expect(result.targetMeters).toBe(6_000);
  });
});
