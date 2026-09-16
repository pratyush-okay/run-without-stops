import { unstable_cache } from "next/cache";
import { z } from "zod";
import { env } from "@/env";
import type { BoundingBox, RunnerFeature } from "@/lib/schemas/features";

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

export function normalizeOverpassElement(input: unknown): RunnerFeature | undefined {
  const element = overpassElementSchema.parse(input);
  const point =
    element.lat !== undefined && element.lon !== undefined
      ? { lat: element.lat, lng: element.lon }
      : element.center
        ? { lat: element.center.lat, lng: element.center.lon }
        : undefined;

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

async function requestEndpoint(endpoint: string, box: BoundingBox): Promise<RunnerFeature[]> {
  const response = await fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams({ data: queryFor(box) }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "RunWithoutStops/0.1 (https://runwithoutstops.app)",
    },
    signal: AbortSignal.timeout(22_000),
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status}`);
  }

  const payload = overpassResponseSchema.parse(await response.json());
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
  const endpoints = env.TRACESTRACK_API_KEY
    ? [`${env.TRACESTRACK_OVERPASS_URL}/${encodeURIComponent(env.TRACESTRACK_API_KEY)}/interpreter`]
    : [...new Set([env.OVERPASS_API_URL, "https://overpass.kumi.systems/api/interpreter"])];

  for (const endpoint of endpoints) {
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
