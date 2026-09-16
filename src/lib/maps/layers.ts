export type MapLayerVisibility = {
  traffic_signal: boolean;
  crossing: boolean;
  drinking_water: boolean;
  parks: boolean;
  highways: boolean;
  busy_roads: boolean;
};

export const MAPBOX_DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export const HIGHWAY_ALERT = "#ff5a2a";
export const BUSY_ROAD = "#f0b429";
export const PARK_FILL = "#2f6a3c";
export const ROUTE_LIME = "#c8ff52";

export const PARK_CLASSES = ["park", "pitch"] as const;

export function isRunnerOverlayLayer(id: string) {
  return id.startsWith("runner-") || id.startsWith("user-");
}

export function isQuietLabelLayer(id: string) {
  return /poi|transit|airport|attraction|landmark/i.test(id);
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

export function isHighwayBasemapLayer(id: string) {
  if (isRunnerOverlayLayer(id) || /label|intersection/i.test(id)) return false;
  return /motorway|trunk|major-link/i.test(id);
}

export function isBusyRoadBasemapLayer(id: string) {
  if (isRunnerOverlayLayer(id) || /label|intersection|tertiary/i.test(id)) return false;
  if (isHighwayBasemapLayer(id)) return false;
  return /primary|secondary/i.test(id);
}
