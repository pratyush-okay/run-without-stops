export const MAPBOX_DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export const MAP_STYLE_IDS = ["dark", "streets", "satellite"] as const;

export type MapStyleId = (typeof MAP_STYLE_IDS)[number];

export type MapStyleOption = {
  id: MapStyleId;
  label: string;
  url: string;
};

export const DEFAULT_MAP_STYLE_ID: MapStyleId = "dark";

export const MAP_STYLES: readonly MapStyleOption[] = [
  {
    id: "dark",
    label: "Dark",
    url: MAPBOX_DARK_STYLE,
  },
  {
    id: "streets",
    label: "Streets",
    url: "mapbox://styles/mapbox/streets-v12",
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "mapbox://styles/mapbox/satellite-v9",
  },
];

const MAP_STYLE_STORAGE_KEY = "rws-map-style";

const stylesById = new Map(MAP_STYLES.map((style) => [style.id, style]));

export function isMapStyleId(value: unknown): value is MapStyleId {
  return typeof value === "string" && MAP_STYLE_IDS.includes(value as MapStyleId);
}

export function mapStyleById(id: MapStyleId): MapStyleOption {
  const style = stylesById.get(id) ?? stylesById.get(DEFAULT_MAP_STYLE_ID);
  if (!style) throw new Error("Map style catalog is empty");
  return style;
}

export function mapStyleUrl(id: MapStyleId): string {
  return mapStyleById(id).url;
}

export function nextMapStyle(id: MapStyleId): MapStyleId {
  const index = MAP_STYLE_IDS.indexOf(id);
  return MAP_STYLE_IDS[(index + 1) % MAP_STYLE_IDS.length] ?? DEFAULT_MAP_STYLE_ID;
}

export function readStoredMapStyle(): MapStyleId {
  if (typeof window === "undefined") return DEFAULT_MAP_STYLE_ID;
  try {
    const stored = window.localStorage.getItem(MAP_STYLE_STORAGE_KEY);
    return isMapStyleId(stored) ? stored : DEFAULT_MAP_STYLE_ID;
  } catch {
    return DEFAULT_MAP_STYLE_ID;
  }
}

export function writeStoredMapStyle(id: MapStyleId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MAP_STYLE_STORAGE_KEY, id);
  } catch {
    return;
  }
}
