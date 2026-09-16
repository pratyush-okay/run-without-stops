import {
  isBusyRoadBasemapLayer,
  isHighwayBasemapLayer,
  isParkBasemapLayer,
  isQuietLabelLayer,
  isRunnerOverlayLayer,
  MAPBOX_DARK_STYLE,
  parkFillExpression,
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

  it("targets dedicated park layers and mixed landuse, not all vegetation", () => {
    expect(isParkBasemapLayer("national-park")).toBe(true);
    expect(isParkBasemapLayer("landuse")).toBe(true);
    expect(isParkBasemapLayer("landcover")).toBe(false);
    expect(isParkBasemapLayer("road-motorway-trunk")).toBe(false);
    expect(isParkBasemapLayer("poi-label")).toBe(false);
    expect(parkFillExpression("#111", "#2f6a3c")).toEqual([
      "case",
      ["in", ["get", "class"], ["literal", ["park", "pitch"]]],
      "#2f6a3c",
      "#111",
    ]);
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
