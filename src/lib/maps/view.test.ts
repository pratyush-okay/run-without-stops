import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from "@/lib/maps/view";

describe("map camera", () => {
  it("allows a full world zoom-out", () => {
    expect(MAP_MIN_ZOOM).toBe(0);
    expect(MAP_MAX_ZOOM).toBeGreaterThan(MAP_MIN_ZOOM);
  });
});
