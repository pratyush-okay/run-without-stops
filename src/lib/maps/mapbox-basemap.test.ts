import {
  isBusyRoadBasemapLayer,
  isHighwayBasemapLayer,
  isParkBasemapLayer,
  isQuietLabelLayer,
  isRunnerOverlayLayer,
  MAPBOX_DARK_STYLE,
} from "@/lib/maps/layers";

describe("Mapbox 2D dark basemap", () => {
  it("uses the classic dark streets style, not Standard 3D", () => {
    expect(MAPBOX_DARK_STYLE).toBe("mapbox://styles/mapbox/dark-v11");
  });

  it("strips tourist POI and transit labels from the basemap", () => {
    expect(isQuietLabelLayer("poi-label")).toBe(true);
    expect(isQuietLabelLayer("transit-label")).toBe(true);
    expect(isQuietLabelLayer("airport-label")).toBe(true);
    expect(isQuietLabelLayer("road-label")).toBe(false);
    expect(isQuietLabelLayer("settlement-major-label")).toBe(false);
  });

  it("targets park landcover layers for the parks toggle", () => {
    expect(isParkBasemapLayer("national-park")).toBe(true);
    expect(isParkBasemapLayer("landuse")).toBe(true);
    expect(isParkBasemapLayer("road-motorway-trunk")).toBe(false);
    expect(isParkBasemapLayer("poi-label")).toBe(false);
  });

  it("hides motorways and major links with the highways toggle", () => {
    expect(isHighwayBasemapLayer("road-motorway-trunk")).toBe(true);
    expect(isHighwayBasemapLayer("bridge-motorway-trunk-case")).toBe(true);
    expect(isHighwayBasemapLayer("road-major-link")).toBe(true);
    expect(isHighwayBasemapLayer("road-motorway-trunk-oneway")).toBe(true);
    expect(isHighwayBasemapLayer("road-label")).toBe(false);
    expect(isRunnerOverlayLayer("runner-highways")).toBe(true);
    expect(isHighwayBasemapLayer("runner-highways")).toBe(false);
  });

  it("hides primary and secondary roads with the busy-roads toggle", () => {
    expect(isBusyRoadBasemapLayer("road-primary")).toBe(true);
    expect(isBusyRoadBasemapLayer("bridge-primary")).toBe(true);
    expect(isBusyRoadBasemapLayer("road-secondary-tertiary-case")).toBe(false);
    expect(isBusyRoadBasemapLayer("road-motorway-trunk")).toBe(false);
    expect(isBusyRoadBasemapLayer("road-street")).toBe(false);
  });
});
