import {
  boundingBoxDiagonalMeters,
  countFeaturesNearRoute,
  featuresNearRoute,
  isWithinSydney,
  quantizeBoundingBox,
  signalAvoidancePolygons,
} from "@/lib/geo";
import type { RunnerFeature } from "@/lib/schemas/features";

const route = [
  { lat: -33.87, lng: 151.2 },
  { lat: -33.87, lng: 151.22 },
];

const features: RunnerFeature[] = [
  {
    id: "near",
    kind: "traffic_signal",
    point: { lat: -33.87, lng: 151.21 },
  },
  {
    id: "far",
    kind: "traffic_signal",
    point: { lat: -33.9, lng: 151.3 },
  },
  {
    id: "crossing",
    kind: "crossing",
    point: { lat: -33.87005, lng: 151.215 },
  },
];

describe("Sydney geo helpers", () => {
  it("validates and quantizes bounded Sydney viewports", () => {
    const bounds = {
      south: -33.89,
      west: 151.18,
      north: -33.84,
      east: 151.25,
    };

    expect(isWithinSydney(bounds)).toBe(true);
    expect(boundingBoxDiagonalMeters(bounds)).toBeLessThan(35_000);
    expect(
      quantizeBoundingBox({
        south: -33.87541,
        west: 151.20141,
        north: -33.86541,
        east: 151.21141,
      }),
    ).toEqual({
      south: -33.876,
      west: 151.201,
      north: -33.865,
      east: 151.212,
    });
  });

  it("counts only features close to the returned route", () => {
    expect(countFeaturesNearRoute(features, route, "traffic_signal")).toBe(1);
    expect(countFeaturesNearRoute(features, route, "crossing")).toBe(1);
    expect(featuresNearRoute(features, route).map((feature) => feature.id)).toEqual([
      "near",
      "crossing",
    ]);
  });

  it("keeps one crossing per intersection and ignores nearby off-route copies", () => {
    const stacked: RunnerFeature[] = Array.from({ length: 6 }, (_, index) => ({
      id: `stack-${index}`,
      kind: "crossing",
      point: {
        lat: -33.87 + index * 0.00002,
        lng: 151.215 + (index % 2) * 0.00003,
      },
    }));
    const parallelStreet: RunnerFeature = {
      id: "parallel",
      kind: "crossing",
      point: { lat: -33.8704, lng: 151.215 },
    };
    const nextBlock: RunnerFeature = {
      id: "next-block",
      kind: "crossing",
      point: { lat: -33.87, lng: 151.2162 },
    };

    const visible = featuresNearRoute([...stacked, parallelStreet, nextBlock], route);

    expect(visible.filter((feature) => feature.kind === "crossing")).toHaveLength(2);
    expect(visible.map((feature) => feature.id)).toContain("stack-0");
    expect(visible.map((feature) => feature.id)).toContain("next-block");
    expect(visible.map((feature) => feature.id)).not.toContain("parallel");
    expect(visible.find((feature) => feature.id === "stack-0")?.point.lat).toBeCloseTo(-33.87, 5);
  });

  it("hides a crossing when a traffic light already marks that intersection", () => {
    const visible = featuresNearRoute(
      [
        {
          id: "light",
          kind: "traffic_signal",
          point: { lat: -33.87, lng: 151.215 },
        },
        {
          id: "cross",
          kind: "crossing",
          point: { lat: -33.87003, lng: 151.21508 },
        },
      ],
      route,
    );

    expect(visible.map((feature) => feature.id)).toEqual(["light"]);
  });

  it("turns the closest traffic signal into a closed avoidance polygon", () => {
    const polygons = signalAvoidancePolygons(features, route, 1);
    const ring = polygons[0]?.geometry.coordinates[0];

    expect(polygons).toHaveLength(1);
    expect(polygons[0]?.id).toBe("signal_0");
    expect(ring?.[0]).toEqual(ring?.at(-1));
  });
});
