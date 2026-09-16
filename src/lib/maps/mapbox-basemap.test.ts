import { isParkBasemapLayer, isQuietLabelLayer, MAPBOX_DARK_STYLE } from "@/lib/maps/layers";

describe("Mapbox 2D dark basemap", () => {
  it("uses the classic dark streets style, not Standard 3D", () => {
    expect(MAPBOX_DARK_STYLE).toBe("mapbox://styles/mapbox/dark-v11");
  });

  it("strips tourist POI and transit labels from the basemap", () => {
    expect(isQuietLabelLayer("poi-label")).toBe(true);
    expect(isQuietLabelLayer("transit-label")).toBe(true);
    expect(isQuietLabelLayer("airport-label")).toBe(true);
    expect(isQuietLabelLayer("road-label")).toBe(false);
    expect(isQuietLabelLayer("place-city")).toBe(false);
  });

  it("targets park landcover layers for the parks toggle", () => {
    expect(isParkBasemapLayer("national-park")).toBe(true);
    expect(isParkBasemapLayer("landuse")).toBe(true);
    expect(isParkBasemapLayer("road-motorway")).toBe(false);
  });
});
