import type { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";
import { BUSY_ROAD_CLASSES, HIGHWAY_CLASSES } from "@/lib/maps/road-visibility";

export type MapLayerVisibility = {
  traffic_signal: boolean;
  crossing: boolean;
  drinking_water: boolean;
  parks: boolean;
  highways: boolean;
  busy_roads: boolean;
};

export { MAPBOX_DARK_STYLE } from "@/lib/maps/styles";

export const HIGHWAY_ALERT = "#ff5a2a";
export const BUSY_ROAD = "#f0b429";
export const PARK_FILL = "#3f9a52";
export const ROUTE_LIME = "#c8ff52";
export const STOP_CORAL = "#ff5d7a";

export const PARK_CLASSES = ["park", "pitch"] as const;
export const CONTEXT_OVERLAY_BEFORE = "runner-route-glow";

export function contextOverlayLayers(): Array<FillLayerSpecification | LineLayerSpecification> {
  return [
    {
      id: "runner-parks",
      type: "fill",
      source: "composite",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", [...PARK_CLASSES]]],
      layout: { visibility: "none" },
      paint: {
        "fill-color": PARK_FILL,
        "fill-opacity": 0.7,
      },
    },
    {
      id: "runner-parks-national",
      type: "fill",
      source: "composite",
      "source-layer": "landuse_overlay",
      filter: ["==", ["get", "class"], "national_park"],
      layout: { visibility: "none" },
      paint: {
        "fill-color": PARK_FILL,
        "fill-opacity": 0.55,
      },
    },
    {
      id: "runner-busy-roads",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: ["in", ["get", "class"], ["literal", [...BUSY_ROAD_CLASSES]]],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": BUSY_ROAD,
        "line-opacity": 0.9,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 14, 2.8, 18, 8],
      },
    },
    {
      id: "runner-highways",
      type: "line",
      source: "composite",
      "source-layer": "road",
      filter: ["in", ["get", "class"], ["literal", [...HIGHWAY_CLASSES]]],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": HIGHWAY_ALERT,
        "line-opacity": 0.94,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.6, 14, 3.6, 18, 11],
      },
    },
  ];
}

export function overlayVisibility(id: string, layers: MapLayerVisibility): "visible" | "none" {
  if (id === "runner-parks" || id === "runner-parks-national") {
    return layers.parks ? "visible" : "none";
  }
  if (id === "runner-highways") return layers.highways ? "visible" : "none";
  if (id === "runner-busy-roads") return layers.busy_roads ? "visible" : "none";
  return "visible";
}

export function isRunnerOverlayLayer(id: string) {
  return id.startsWith("runner-") || id.startsWith("user-");
}

export function isQuietLabelLayer(id: string) {
  if (isRunnerOverlayLayer(id)) return false;
  return /(?:^|-)(poi|transit|airport|attraction|landmark)(?:-|$)/i.test(id);
}

export function isExclusiveParkLayer(id: string) {
  return id === "national-park" || id === "pitch";
}

export function isMixedParkLayer(id: string) {
  return id === "landuse";
}

export function isParkBasemapLayer(id: string) {
  if (isRunnerOverlayLayer(id) || /label/i.test(id)) return false;
  return isExclusiveParkLayer(id) || isMixedParkLayer(id) || /national-park/i.test(id);
}

export function parkFillExpression(original: unknown, color: string) {
  return ["case", ["in", ["get", "class"], ["literal", [...PARK_CLASSES]]], color, original];
}

export function parkOpacityExpression(original: unknown, parksOn: boolean, onOpacity = 0.92) {
  return [
    "case",
    ["in", ["get", "class"], ["literal", [...PARK_CLASSES]]],
    parksOn ? onOpacity : 0,
    original ?? 1,
  ];
}

export function isHighwayBasemapLayer(id: string) {
  if (isRunnerOverlayLayer(id) || /label|intersection/i.test(id)) return false;
  return /motorway|trunk|major-link/i.test(id);
}

export function isBusyRoadBasemapLayer(id: string) {
  if (isRunnerOverlayLayer(id) || /label|intersection|tertiary/i.test(id)) return false;
  if (isHighwayBasemapLayer(id)) return false;
  return /primary|secondary/i.test(id);
}
