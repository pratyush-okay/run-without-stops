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
export const ROUTE_LIME = "#c8ff52";

const PARK_LAYER_IDS = new Set(["national-park", "landuse", "landcover", "pitch"]);

export function isQuietLabelLayer(id: string) {
  return /poi|transit|airport|attraction|landmark/i.test(id);
}

export function isParkBasemapLayer(id: string) {
  return PARK_LAYER_IDS.has(id);
}
