import { describe, expect, it } from "vitest";
import { displayedRouteFeatureCounts } from "@/lib/maps/route-feature-counts";
import type { RunnerFeature } from "@/lib/schemas/features";

const route = [
  { lat: -33.87, lng: 151.2 },
  { lat: -33.87, lng: 151.22 },
];

describe("displayed route feature counts", () => {
  it("counts every light the map draws, including ones past the routing sample", () => {
    const metersPerLng = 111_320 * Math.cos((-33.87 * Math.PI) / 180);
    const lights: RunnerFeature[] = Array.from({ length: 4 }, (_, index) => ({
      id: `light-${index}`,
      kind: "traffic_signal",
      point: { lat: -33.87, lng: 151.205 + (index * 80) / metersPerLng },
    }));

    expect(displayedRouteFeatureCounts(lights, route, undefined, route)).toEqual({
      trafficSignals: 4,
      crossings: 0,
      drinkingWater: 0,
    });
    expect(
      displayedRouteFeatureCounts(lights, route, { traffic_signal: false }, route),
    ).toMatchObject({ trafficSignals: 0 });
  });

  it("skips a light the map clears beside the start", () => {
    const metersPerLng = 111_320 * Math.cos((-33.87 * Math.PI) / 180);
    const lights: RunnerFeature[] = [
      {
        id: "at-start",
        kind: "traffic_signal",
        point: { lat: -33.87, lng: 151.2 },
      },
      {
        id: "down-the-street",
        kind: "traffic_signal",
        point: { lat: -33.87, lng: 151.2 + 80 / metersPerLng },
      },
    ];

    expect(displayedRouteFeatureCounts(lights, route, undefined, route)).toEqual({
      trafficSignals: 1,
      crossings: 0,
      drinkingWater: 0,
    });
  });
});
