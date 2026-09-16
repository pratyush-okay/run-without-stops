import { z } from "zod";
import { env } from "@/env";
import { countFeaturesNearRoute } from "@/lib/geo";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

const valhallaResponseSchema = z.object({
  trip: z.object({
    legs: z.array(z.object({ shape: z.string() })).min(1),
    summary: z.object({
      length: z.number(),
      time: z.number(),
    }),
  }),
});

export function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const coordinates: [number, number][] = [];
  const factor = 10 ** precision;
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const deltas: number[] = [];
    for (let coordinate = 0; coordinate < 2; coordinate += 1) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      deltas.push(result & 1 ? ~(result >> 1) : result >> 1);
    }
    latitude += deltas[0] ?? 0;
    longitude += deltas[1] ?? 0;
    coordinates.push([longitude / factor, latitude / factor]);
  }

  return coordinates;
}

export async function fetchValhallaRoute(input: RouteRequest): Promise<RouteResponse> {
  const response = await fetch(env.VALHALLA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locations: input.points.map((point) => ({ lat: point.lat, lon: point.lng })),
      costing: "pedestrian",
      units: "kilometers",
      costing_options: {
        pedestrian:
          input.mode === "low_stops"
            ? {
                walkway_factor: 0.75,
                sidewalk_factor: 0.8,
                alley_factor: 3,
                driveway_factor: 4,
                step_penalty: 90,
              }
            : {},
      },
    }),
    signal: AbortSignal.timeout(18_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Valhalla request failed with ${response.status}`);
  }

  const payload = valhallaResponseSchema.parse(await response.json());
  const coordinates = payload.trip.legs.flatMap((leg, index) => {
    const decoded = decodePolyline(leg.shape);
    return index === 0 ? decoded : decoded.slice(1);
  });
  const routePoints: GeoPoint[] = coordinates.map(([lng, lat]) => ({ lng, lat }));

  return {
    coordinates,
    metrics: {
      distanceMeters: payload.trip.summary.length * 1000,
      durationSeconds: payload.trip.summary.time,
      trafficSignals: countFeaturesNearRoute(input.features, routePoints, "traffic_signal"),
      crossings: countFeaturesNearRoute(input.features, routePoints, "crossing"),
      majorRoadMeters: 0,
    },
    provider: "valhalla",
    warnings: [
      "Development routing is using public Valhalla; configure GraphHopper for full low-stop road penalties.",
    ],
  };
}
