import { normalizeOverpassElement } from "@/lib/osm/overpass";

describe("Overpass normalization", () => {
  it("normalizes traffic lights and drinking fountains", () => {
    expect(
      normalizeOverpassElement({
        type: "node",
        id: 10,
        lat: -33.86,
        lon: 151.21,
        tags: { highway: "traffic_signals" },
      }),
    ).toMatchObject({
      id: "node/10",
      kind: "traffic_signal",
      point: { lat: -33.86, lng: 151.21 },
    });

    expect(
      normalizeOverpassElement({
        type: "way",
        id: 11,
        center: { lat: -33.87, lon: 151.22 },
        tags: { amenity: "drinking_water", bottle: "yes" },
      }),
    ).toMatchObject({
      kind: "drinking_water",
      detail: "Bottle refill",
    });
  });

  it("labels unmarked crossings as Crossing without a zebra name", () => {
    expect(
      normalizeOverpassElement({
        type: "node",
        id: 13,
        lat: -33.87,
        lon: 151.22,
        tags: { highway: "crossing", "crossing:markings": "zebra" },
      }),
    ).toMatchObject({
      kind: "crossing",
      name: "Crossing",
    });
    expect(
      normalizeOverpassElement({
        type: "node",
        id: 13,
        lat: -33.87,
        lon: 151.22,
        tags: { highway: "crossing", "crossing:markings": "zebra" },
      })?.detail,
    ).toBeUndefined();
  });

  it("classifies signalized crossings as traffic signals", () => {
    expect(
      normalizeOverpassElement({
        type: "node",
        id: 12,
        lat: -33.87,
        lon: 151.22,
        tags: { highway: "crossing", crossing: "traffic_signals" },
      }),
    ).toMatchObject({
      kind: "traffic_signal",
      name: "Signalized crossing",
    });
  });
});
