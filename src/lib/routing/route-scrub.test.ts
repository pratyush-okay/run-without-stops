import { nearestScrubOnRoute, routePrefix, scrubAtDistance } from "@/lib/routing/route-scrub";

const line: [number, number][] = [
  [151.2, -33.87],
  [151.21, -33.87],
  [151.22, -33.87],
];

const samples = [
  { distanceMeters: 0, elevationMeters: 10, lat: -33.87, lng: 151.2 },
  { distanceMeters: 900, elevationMeters: 40, lat: -33.87, lng: 151.21 },
  { distanceMeters: 1800, elevationMeters: 22, lat: -33.87, lng: 151.22 },
];

describe("route scrub", () => {
  it("snaps a nearby hover to the line and interpolates elevation", () => {
    const scrub = nearestScrubOnRoute(line, samples, { lat: -33.8702, lng: 151.21 });
    expect(scrub).toBeDefined();
    expect(scrub?.point.lng).toBeCloseTo(151.21, 3);
    expect(scrub?.elevationMeters).toBeCloseTo(40, 0);
  });

  it("ignores hovers that are far from the route", () => {
    expect(nearestScrubOnRoute(line, samples, { lat: -33.9, lng: 151.3 })).toBeUndefined();
  });

  it("builds a scrub from distance along the route", () => {
    const scrub = scrubAtDistance(line, samples, 900);
    expect(scrub?.point.lng).toBeCloseTo(151.21, 3);
    expect(scrub?.elevationMeters).toBeCloseTo(40, 0);
  });

  it("returns the prefix of the route up to a distance", () => {
    const prefix = routePrefix(line, 900);
    expect(prefix[0]).toEqual([151.2, -33.87]);
    expect(prefix.at(-1)?.[0]).toBeCloseTo(151.21, 3);
    expect(prefix.length).toBeGreaterThanOrEqual(2);
  });
});
