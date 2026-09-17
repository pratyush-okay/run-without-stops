import {
  BUSY_ROAD,
  CONTEXT_OVERLAY_BEFORE,
  contextOverlayLayers,
  HIGHWAY_ALERT,
  isBusyRoadBasemapLayer,
  isHighwayBasemapLayer,
  isParkBasemapLayer,
  isQuietLabelLayer,
  isRunnerOverlayLayer,
  MAPBOX_DARK_STYLE,
  overlayVisibility,
  PARK_FILL,
  parkFillExpression,
  parkOpacityExpression,
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
    expect(isQuietLabelLayer("runner-waypoints")).toBe(false);
    expect(isQuietLabelLayer("runner-waypoint-labels")).toBe(false);
    expect(isQuietLabelLayer("runner-elevation")).toBe(false);
  });

  it("targets dedicated park layers and mixed landuse, not all vegetation", () => {
    expect(isParkBasemapLayer("national-park")).toBe(true);
    expect(isParkBasemapLayer("landuse")).toBe(true);
    expect(isParkBasemapLayer("landcover")).toBe(false);
    expect(isParkBasemapLayer("road-motorway-trunk")).toBe(false);
    expect(isParkBasemapLayer("poi-label")).toBe(false);
    expect(parkFillExpression("#111", "#3f9a52")).toEqual([
      "case",
      ["in", ["get", "class"], ["literal", ["park", "pitch"]]],
      "#3f9a52",
      "#111",
    ]);
    expect(parkOpacityExpression(0.2, false)).toEqual([
      "case",
      ["in", ["get", "class"], ["literal", ["park", "pitch"]]],
      0,
      0.2,
    ]);
    expect(parkOpacityExpression(0.2, true)).toEqual([
      "case",
      ["in", ["get", "class"], ["literal", ["park", "pitch"]]],
      0.92,
      0.2,
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

  it("paints parks, highways, and busy roads as overlays on top of the basemap", () => {
    const overlays = contextOverlayLayers();
    expect(CONTEXT_OVERLAY_BEFORE).toBe("runner-route-glow");
    expect(overlays.map((layer) => layer.id)).toEqual([
      "runner-parks",
      "runner-parks-national",
      "runner-busy-roads",
      "runner-highways",
    ]);
    expect(overlays.every((layer) => layer.layout?.visibility === "none")).toBe(true);
    const parks = overlays.find((layer) => layer.id === "runner-parks");
    const highways = overlays.find((layer) => layer.id === "runner-highways");
    const busy = overlays.find((layer) => layer.id === "runner-busy-roads");
    expect(parks?.type).toBe("fill");
    expect(highways?.type).toBe("line");
    expect(busy?.type).toBe("line");
    if (parks?.type === "fill") expect(parks.paint?.["fill-color"]).toBe(PARK_FILL);
    if (highways?.type === "line") expect(highways.paint?.["line-color"]).toBe(HIGHWAY_ALERT);
    if (busy?.type === "line") expect(busy.paint?.["line-color"]).toBe(BUSY_ROAD);
  });

  it("enables each overlay independently", () => {
    const off = {
      traffic_signal: true,
      crossing: true,
      drinking_water: true,
      parks: false,
      highways: false,
      busy_roads: false,
    };
    expect(overlayVisibility("runner-parks", off)).toBe("none");
    expect(overlayVisibility("runner-highways", off)).toBe("none");
    expect(overlayVisibility("runner-busy-roads", off)).toBe("none");
    expect(overlayVisibility("runner-parks", { ...off, parks: true })).toBe("visible");
    expect(overlayVisibility("runner-highways", { ...off, highways: true })).toBe("visible");
    expect(overlayVisibility("runner-busy-roads", { ...off, busy_roads: true })).toBe("visible");
  });
});
