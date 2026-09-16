import { z } from "zod";
import { env } from "@/env";
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

async function searchNominatim(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "6",
    bounded: "1",
    viewbox: "150.58,-33.48,151.50,-34.22",
  });
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

export async function searchSydney(query: string): Promise<SearchResult[]> {
  if (!env.STADIA_MAPS_API_KEY) return searchNominatim(query);

  const params = new URLSearchParams({
    text: query,
    "focus.point.lat": "-33.8688",
    "focus.point.lon": "151.2093",
    "boundary.rect.min_lat": "-34.22",
    "boundary.rect.min_lon": "150.58",
    "boundary.rect.max_lat": "-33.48",
    "boundary.rect.max_lon": "151.50",
    size: "6",
    api_key: env.STADIA_MAPS_API_KEY,
  });
  const response = await fetch(`https://api.stadiamaps.com/geocoding/v1/search?${params}`, {
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Stadia search failed with ${response.status}`);

  const payload = stadiaResponseSchema.parse(await response.json());
  return payload.features.map((feature, index) => ({
    id: String(feature.id ?? index),
    label:
      feature.properties.label ??
      feature.properties.formatted ??
      feature.properties.name ??
      "Sydney result",
    point: {
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    },
  }));
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

export async function reverseSydney(point: GeoPoint): Promise<string> {
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
