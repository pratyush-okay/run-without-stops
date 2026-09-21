import { unstable_cache } from "next/cache";
import { z } from "zod";
import { env } from "@/env";
import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";

const overpassElementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const overpassResponseSchema = z.object({
  elements: z.array(overpassElementSchema),
});

export type OverpassElement = z.infer<typeof overpassElementSchema>;

function queryFor(box: BoundingBox) {
  const bounds = `${box.south},${box.west},${box.north},${box.east}`;
  return `[out:json][timeout:20][maxsize:33554432];
(
  node["highway"="traffic_signals"](${bounds});
  node["highway"="crossing"](${bounds});
  nwr["amenity"="drinking_water"](${bounds});
);
out center tags;`;
}

type RunnerFeaturesResult = {
  features: RunnerFeature[];
  partial: boolean;
};

function overpassEndpoints() {
  if (env.TRACESTRACK_API_KEY) {
    return [
      `${env.TRACESTRACK_OVERPASS_URL}/${encodeURIComponent(env.TRACESTRACK_API_KEY)}/interpreter`,
    ];
  }
  return [...new Set([env.OVERPASS_API_URL, "https://overpass.kumi.systems/api/interpreter"])];
}

export function overpassPoint(element: OverpassElement): GeoPoint | undefined {
  if (element.lat !== undefined && element.lon !== undefined) {
    return { lat: element.lat, lng: element.lon };
  }
  if (element.center) return { lat: element.center.lat, lng: element.center.lon };
  return undefined;
}

export function normalizeOverpassElement(input: unknown): RunnerFeature | undefined {
  const element = overpassElementSchema.parse(input);
  const point = overpassPoint(element);

  if (!point) return undefined;
  const tags = element.tags ?? {};

  if (tags.amenity === "drinking_water") {
    return {
      id: `${element.type}/${element.id}`,
      kind: "drinking_water",
      point,
      name: tags.name ?? "Drinking water",
      detail: tags.bottle === "yes" ? "Bottle refill" : "Public fountain",
    };
  }

  if (tags.highway === "traffic_signals") {
    return {
      id: `${element.type}/${element.id}`,
      kind: "traffic_signal",
      point,
      name: "Traffic light",
    };
  }

  if (tags.highway === "crossing") {
    const signalized = tags.crossing === "traffic_signals" || tags["crossing:signals"] === "yes";
    const marking = tags["crossing:markings"] ?? tags.crossing_ref ?? tags.crossing;
    return {
      id: `${element.type}/${element.id}`,
      kind: signalized ? "traffic_signal" : "crossing",
      point,
      name: signalized ? "Signalized crossing" : "Crossing",
      detail: marking && !/^(zebra|yes|no|uncontrolled)$/i.test(marking) ? marking : undefined,
    };
  }

  return undefined;
}

async function postOverpass(endpoint: string, query: string, timeoutMs: number) {
  const response = await fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams({ data: query }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "RunWithoutStops/0.1 (https://runwithoutstops.app)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Overpass request failed with ${response.status}`);
  return overpassResponseSchema.parse(await response.json());
}

export async function queryOverpass(query: string): Promise<OverpassElement[]> {
  for (const endpoint of overpassEndpoints()) {
    try {
      return (await postOverpass(endpoint, query, 16_000)).elements;
    } catch {
      // Public Overpass instances can throttle independently; try the next mirror.
    }
  }
  return [];
}

async function requestEndpoint(endpoint: string, box: BoundingBox): Promise<RunnerFeature[]> {
  const payload = await postOverpass(endpoint, queryFor(box), 22_000);
  const features = payload.elements
    .map(normalizeOverpassElement)
    .filter((feature): feature is RunnerFeature => feature !== undefined);

  const unique = [...new Map(features.map((feature) => [feature.id, feature])).values()];
  return [
    ...unique.filter((feature) => feature.kind === "traffic_signal").slice(0, 1_200),
    ...unique.filter((feature) => feature.kind === "crossing").slice(0, 1_500),
    ...unique.filter((feature) => feature.kind === "drinking_water").slice(0, 300),
  ];
}

async function requestRunnerFeatures(box: BoundingBox): Promise<RunnerFeaturesResult> {
  for (const endpoint of overpassEndpoints()) {
    try {
      return { features: await requestEndpoint(endpoint, box), partial: false };
    } catch {
      // Public Overpass instances can throttle independently; try the next mirror.
    }
  }

  return { features: [], partial: true };
}

export const fetchRunnerFeatures = unstable_cache(requestRunnerFeatures, ["runner-features-v4"], {
  revalidate: 300,
});
