import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MAP_STYLE_ID,
  isMapStyleId,
  MAP_STYLES,
  MAPBOX_DARK_STYLE,
  mapStyleById,
  mapStyleUrl,
  readStoredMapStyle,
  writeStoredMapStyle,
} from "@/lib/maps/styles";

describe("Mapbox style catalog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps dark streets as the default look", () => {
    expect(DEFAULT_MAP_STYLE_ID).toBe("dark");
    expect(mapStyleUrl("dark")).toBe(MAPBOX_DARK_STYLE);
    expect(MAPBOX_DARK_STYLE).toBe("mapbox://styles/mapbox/dark-v11");
  });

  it("offers only dark, streets, and satellite", () => {
    expect(MAP_STYLES.map((style) => style.id)).toEqual(["dark", "streets", "satellite"]);
    expect(mapStyleUrl("streets")).toBe("mapbox://styles/mapbox/streets-v12");
    expect(mapStyleUrl("satellite")).toBe("mapbox://styles/mapbox/satellite-v9");
  });

  it("rejects unknown style ids and falls back to dark", () => {
    expect(isMapStyleId("dark")).toBe(true);
    expect(isMapStyleId("light")).toBe(false);
    expect(isMapStyleId("paper")).toBe(false);
    expect(mapStyleById("dark").label).toBe("Dark");
  });

  it("remembers the last chosen style", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        clear: () => store.clear(),
      },
    });

    expect(readStoredMapStyle()).toBe("dark");
    writeStoredMapStyle("satellite");
    expect(readStoredMapStyle()).toBe("satellite");
    store.set("rws-map-style", "light");
    expect(readStoredMapStyle()).toBe("dark");
  });
});
