import { gapIndexOnRoute } from "@/lib/routing/route-gap";

const start = { lat: -33.87, lng: 151.2 };
const middle = { lat: -33.87, lng: 151.21 };
const end = { lat: -33.87, lng: 151.22 };

describe("gapIndexOnRoute", () => {
  it("names the stop gap that owns a point along the line", () => {
    const coordinates: [number, number][] = [
      [151.2, -33.87],
      [151.205, -33.87],
      [151.21, -33.87],
      [151.215, -33.87],
      [151.22, -33.87],
    ];
    expect(gapIndexOnRoute([start, middle, end], coordinates, 100)).toBe(0);
    expect(gapIndexOnRoute([start, middle, end], coordinates, 1400)).toBe(1);
  });
});
