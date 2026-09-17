import { z } from "zod";
import { env } from "@/env";
import { SYDNEY_CENTER } from "@/lib/geo";
import { shortPlaceLabel } from "@/lib/maps/place-label";
import type { GeoPoint } from "@/lib/schemas/features";
import type { SearchResult } from "@/lib/schemas/search";

const stadiaResponseSchema = z.object({
  features: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).optional(),
      geometry: z.object({
        coordinates: z.tuple([z.number(), z.number()]),
      }),
      properties: z
        .object({
          label: z.string().optional(),
          name: z.string().optional(),
          formatted: z.string().optional(),
        })
        .passthrough(),
    }),
  ),
});

const nominatimResponseSchema = z.array(
  z.object({
    place_id: z.number(),
    display_name: z.string(),
    lat: z.string(),
    lon: z.string(),
  }),
);

export function stadiaSearchParams(
  query: string,
  apiKey: string,
  focus?: GeoPoint,
  options: { localRadiusKm?: number } = {},
) {
  const params = new URLSearchParams({
    text: query,
    size: "6",
    api_key: apiKey,
  });
  if (focus) {
    params.set("focus.point.lat", String(focus.lat));
    params.set("focus.point.lon", String(focus.lng));
  }
  if (focus && options.localRadiusKm) {
    params.set("boundary.circle.lat", String(focus.lat));
    params.set("boundary.circle.lon", String(focus.lng));
    params.set("boundary.circle.radius", String(options.localRadiusKm));
  } else {
    params.set("layers", "coarse");
  }
  return params;
}

export function nominatimSearchParams(
  query: string,
  focus: GeoPoint,
  options: { bounded?: boolean } = {},
) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "6",
  });
  if (options.bounded) {
    params.set(
      "viewbox",
      [
        (focus.lng - 0.4).toFixed(4),
        (focus.lat + 0.4).toFixed(4),
        (focus.lng + 0.4).toFixed(4),
        (focus.lat - 0.4).toFixed(4),
      ].join(","),
    );
    params.set("bounded", "1");
  }
  return params;
}

async function fetchNominatim(
  query: string,
  focus: GeoPoint,
  bounded: boolean,
): Promise<SearchResult[]> {
  const params = nominatimSearchParams(query, focus, { bounded });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "RunWithoutStops/0.1 (https://runwithoutstops.app)" },
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Nominatim search failed with ${response.status}`);

  return nominatimResponseSchema.parse(await response.json()).map((result) => ({
    id: String(result.place_id),
    label: result.display_name,
    point: { lat: Number(result.lat), lng: Number(result.lon) },
  }));
}

function mergePlaceResults(local: SearchResult[], worldwide: SearchResult[]) {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const result of [...local, ...worldwide]) {
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    merged.push(result);
    if (merged.length >= 6) break;
  }
  return merged;
}

async function searchNominatim(query: string, focus: GeoPoint): Promise<SearchResult[]> {
  const [local, worldwide] = await Promise.all([
    fetchNominatim(query, focus, true).catch(() => []),
    fetchNominatim(query, focus, false),
  ]);
  return mergePlaceResults(local.slice(0, 2), worldwide);
}

function parseStadiaResults(payload: z.infer<typeof stadiaResponseSchema>): SearchResult[] {
  return payload.features.map((feature, index) => ({
    id: String(feature.id ?? index),
    label:
      feature.properties.label ??
      feature.properties.formatted ??
      feature.properties.name ??
      "Place",
    point: {
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    },
  }));
}

async function fetchStadia(
  query: string,
  apiKey: string,
  focus: GeoPoint,
  localRadiusKm?: number,
): Promise<SearchResult[]> {
  const params = localRadiusKm
    ? stadiaSearchParams(query, apiKey, focus, { localRadiusKm })
    : stadiaSearchParams(query, apiKey);
  const response = await fetch(`https://api.stadiamaps.com/geocoding/v1/search?${params}`, {
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Stadia search failed with ${response.status}`);
  return parseStadiaResults(stadiaResponseSchema.parse(await response.json()));
}

export async function searchPlaces(
  query: string,
  focus: GeoPoint = SYDNEY_CENTER,
): Promise<SearchResult[]> {
  if (!env.STADIA_MAPS_API_KEY) return searchNominatim(query, focus);

  const [local, worldwide] = await Promise.all([
    fetchStadia(query, env.STADIA_MAPS_API_KEY, focus, 50).catch(() => []),
    fetchStadia(query, env.STADIA_MAPS_API_KEY, focus),
  ]);
  return mergePlaceResults(local.slice(0, 2), worldwide);
}

const nominatimReverseSchema = z.object({
  display_name: z.string(),
  address: z
    .object({
      road: z.string().optional(),
      pedestrian: z.string().optional(),
      suburb: z.string().optional(),
      neighbourhood: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});

export async function reverseGeocode(point: GeoPoint): Promise<string> {
  if (env.STADIA_MAPS_API_KEY) {
    try {
      const params = new URLSearchParams({
        "point.lat": String(point.lat),
        "point.lon": String(point.lng),
        size: "1",
        api_key: env.STADIA_MAPS_API_KEY,
      });
      const response = await fetch(`https://api.stadiamaps.com/geocoding/v1/reverse?${params}`, {
        signal: AbortSignal.timeout(8_000),
        next: { revalidate: 86_400 },
      });
      if (response.ok) {
        const payload = stadiaResponseSchema.parse(await response.json());
        const label =
          payload.features[0]?.properties.label ??
          payload.features[0]?.properties.formatted ??
          payload.features[0]?.properties.name;
        if (label) return shortPlaceLabel(label);
      }
    } catch {
      // Fall through to Nominatim.
    }
  }

  const params = new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lng),
    format: "jsonv2",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { "User-Agent": "RunWithoutStops/0.1 (https://runwithoutstops.app)" },
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Nominatim reverse failed with ${response.status}`);

  const payload = nominatimReverseSchema.parse(await response.json());
  const street = payload.address?.road ?? payload.address?.pedestrian;
  const locality =
    payload.address?.suburb ?? payload.address?.neighbourhood ?? payload.address?.city;
  if (street && locality) return `${street}, ${locality}`;
  if (street) return street;
  return shortPlaceLabel(payload.display_name);
}
