import { z } from "zod";
import { env } from "@/env";
import {
  type ElevatedPoint,
  pointsFromHeightLookup,
  subsampleCoordinates,
} from "@/lib/routing/elevation";

const heightResponseSchema = z.object({
  height: z.array(z.number()).min(2),
});

export async function fetchHeightsAlongRoute(
  coordinates: [number, number][],
): Promise<ElevatedPoint[] | undefined> {
  const sampled = subsampleCoordinates(coordinates);
  const heights = await requestHeights(sampled);
  if (!heights) return undefined;
  return pointsFromHeightLookup(sampled, heights);
}

async function requestHeights(coordinates: [number, number][]) {
  try {
    const response = await fetch(heightEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shape: coordinates.map(([lng, lat]) => ({ lat, lon: lng })),
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return undefined;
    const payload = heightResponseSchema.safeParse(await response.json());
    if (!payload.success) return undefined;
    return payload.data.height.length === coordinates.length ? payload.data.height : undefined;
  } catch {
    return undefined;
  }
}

function heightEndpoint() {
  return env.VALHALLA_API_URL.replace(/\/route\/?$/, "/height");
}
