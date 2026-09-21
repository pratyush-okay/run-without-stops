import { describe, expect, it } from "vitest";
import { savedRouteStatLine } from "@/lib/routes/saved-route-stats";
import {
  metricsForStorage,
  routePartsFromStoredMetrics,
  routeWithDisplayedMetrics,
} from "@/lib/routes/stored-metrics";
import type { RouteResponse } from "@/lib/schemas/route";
import type { SavedRouteSummary } from "@/lib/schemas/saved-route";

const route: RouteResponse = {
  coordinates: [
    [151.2, -33.87],
    [151.21, -33.87],
  ],
  metrics: {
    distanceMeters: 1280,
    durationSeconds: 400,
    ascentMeters: 12,
    descentMeters: 4,
    trafficSignals: 0,
    crossings: 0,
    majorRoadMeters: 80,
  },
  elevation: {
    samples: [
      { distanceMeters: 0, elevationMeters: 10, lat: -33.87, lng: 151.2 },
      { distanceMeters: 1280, elevationMeters: 18, lat: -33.87, lng: 151.21 },
    ],
    marks: [],
  },
  provider: "graphhopper",
  warnings: [],
};

describe("stored route metrics", () => {
  it("stores the lights, crossings, and water the map is showing", () => {
    const saved = routeWithDisplayedMetrics(
      route,
      { trafficSignals: 8, crossings: 1, drinkingWater: 8 },
      330,
    );

    expect(saved.metrics.trafficSignals).toBe(8);
    expect(saved.metrics.crossings).toBe(1);
    expect(saved.metrics.drinkingWater).toBe(8);
    expect(saved.metrics.paceSecondsPerKm).toBe(330);
    expect(saved.metrics.distanceMeters).toBe(1280);
  });

  it("keeps elevation with the saved metrics and reads it back onto the route", () => {
    const stored = metricsForStorage(
      routeWithDisplayedMetrics(route, { trafficSignals: 8, crossings: 1, drinkingWater: 8 }, 330),
    );
    const restored = routePartsFromStoredMetrics(stored);

    expect(restored.metrics.trafficSignals).toBe(8);
    expect(restored.metrics.drinkingWater).toBe(8);
    expect(restored.elevation?.samples).toHaveLength(2);
    expect(restored.metrics).not.toHaveProperty("elevation");
  });

  it("reads a route saved before water and pace were stored", () => {
    const restored = routePartsFromStoredMetrics({
      distanceMeters: 1200,
      durationSeconds: 360,
      trafficSignals: 1,
      crossings: 2,
      majorRoadMeters: 80,
    });

    expect(restored.metrics.trafficSignals).toBe(1);
    expect(restored.metrics.drinkingWater).toBeUndefined();
    expect(restored.elevation).toBeUndefined();
  });

  it("lists every saved stat on a saved route", () => {
    const summary: SavedRouteSummary = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Bomonti to Ultimo",
      shareSlug: "abc12def34",
      sharePath: "/r/abc12def34",
      mode: "low_stops",
      distanceMeters: 1280,
      trafficSignals: 8,
      crossings: 1,
      drinkingWater: 8,
      ascentMeters: 12,
      descentMeters: 4,
      majorRoadMeters: 80,
      paceSecondsPerKm: 330,
      createdAt: "2026-09-22T00:00:00.000Z",
      updatedAt: "2026-09-22T00:00:00.000Z",
    };

    expect(savedRouteStatLine(summary, "metric")).toBe(
      "1.28 km · Low stops · 5:30/km · 7:02 · 12 m gain · 4 m loss · 8 lights · 1 crossing · 8 water · 80 m major",
    );
  });
});
