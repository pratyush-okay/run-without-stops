import { nearestWalkable } from "@/lib/osm/walkable";

describe("nearestWalkable", () => {
  it("picks the closest unused candidate within range", () => {
    const target = { lat: -33.8688, lng: 151.2093 };
    const match = nearestWalkable(target, [
      { lat: -33.88, lng: 151.22 },
      { lat: -33.8689, lng: 151.2094 },
      { lat: -33.87, lng: 151.21 },
    ]);

    expect(match?.index).toBe(1);
  });
});
