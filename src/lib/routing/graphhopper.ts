import { z } from "zod";
import { env } from "@/env";
import { countFeaturesNearRoute, distanceMeters, signalAvoidancePolygons } from "@/lib/geo";
import {
  applyElevationToMetrics,
  elevatedPointsFromCoordinates,
  summarizeElevation,
} from "@/lib/routing/elevation";
import { fetchHeightsAlongRoute } from "@/lib/routing/elevation-lookup";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

const graphHopperPathSchema = z.object({
  distance: z.number(),
  time: z.number(),
  ascend: z.number().optional(),
  descend: z.number().optional(),
  points: z.object({
    coordinates: z.array(
      z.union([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number(), z.number()])]),
    ),
  }),
  details: z
    .object({
      road_class: z.array(z.tuple([z.number(), z.number(), z.string()])).optional(),
    })
    .optional(),
});

const graphHopperResponseSchema = z.object({
  paths: z.array(graphHopperPathSchema).min(1),
});

const MAJOR_ROAD_CLASSES = new Set(["motorway", "trunk", "primary", "secondary"]);

function buildStandardGraphHopperRequest(input: RouteRequest) {
  return {
    points: input.points.map((point) => [point.lng, point.lat]),
    profile: "foot",
    points_encoded: false,
    instructions: false,
    elevation: true,
    details: ["road_class"],
  };
}

export function buildGraphHopperRequest(input: RouteRequest) {
  const signalAreas =
    input.mode === "low_stops" ? signalAvoidancePolygons(input.features, input.points) : [];
  const areaCondition = signalAreas.map((area) => `in_${area.id}`).join(" || ");
  const priority = [
    {
      if: "road_class == MOTORWAY || road_class == TRUNK",
      multiply_by: input.mode === "low_stops" ? 0.05 : 0.5,
    },
    {
      if: "road_class == PRIMARY || road_class == SECONDARY",
      multiply_by: input.mode === "low_stops" ? 0.25 : 0.85,
    },
    {
      if: "road_environment == TUNNEL",
      multiply_by: input.mode === "low_stops" ? 0.1 : 0.7,
    },
  ];

  if (areaCondition) {
    priority.push({ if: areaCondition, multiply_by: 0.25 });
  }

  if (input.avoidElevation) {
    priority.push(
      { if: "max_slope >= 6", multiply_by: 0.45 },
      { if: "max_slope >= 10", multiply_by: 0.2 },
      { if: "max_slope >= 15", multiply_by: 0.08 },
    );
  }

  return {
    points: input.points.map((point) => [point.lng, point.lat]),
    profile: "foot",
    points_encoded: false,
    instructions: false,
    elevation: true,
    details: ["road_class"],
    "ch.disable": true,
    custom_model: {
      distance_influence: input.mode === "low_stops" ? 35 : 70,
      priority,
      areas: {
        type: "FeatureCollection",
        features: signalAreas,
      },
    },
  };
}

function majorRoadDistance(
  coordinates: [number, number][],
  details: [number, number, string][] | undefined,
) {
  if (!details) return 0;
  let total = 0;

  for (const [from, to, roadClass] of details) {
    if (!MAJOR_ROAD_CLASSES.has(roadClass.toLowerCase())) continue;
    for (let index = from; index < to; index += 1) {
      const start = coordinates[index];
      const finish = coordinates[index + 1];
      if (!start || !finish) continue;
      total += distanceMeters({ lng: start[0], lat: start[1] }, { lng: finish[0], lat: finish[1] });
    }
  }

  return total;
}

export async function fetchRoute(input: RouteRequest): Promise<RouteResponse> {
  if (!env.GRAPHHOPPER_API_KEY) {
    throw new Error("GRAPHHOPPER_API_KEY is not configured");
  }

  const payload = await requestGraphHopperPath(input);
  const path = payload.paths[0];
  if (!path) throw new Error("GraphHopper returned no route");

  const coordinates: [number, number][] = path.points.coordinates.map(([lng, lat]) => [lng, lat]);
  const routePoints: GeoPoint[] = coordinates.map(([lng, lat]) => ({ lat, lng }));
  const warnings: string[] = [];
  if (input.features.length === 0) {
    warnings.push("Stop counts are unavailable until nearby map data loads.");
  }

  const elevated =
    elevatedPointsFromCoordinates(path.points.coordinates) ??
    (await fetchHeightsAlongRoute(coordinates));
  const summary = elevated
    ? summarizeElevation(elevated, {
        ...(path.ascend === undefined ? {} : { ascentMeters: path.ascend }),
        ...(path.descend === undefined ? {} : { descentMeters: path.descend }),
      })
    : undefined;

  return {
    coordinates,
    metrics: applyElevationToMetrics(
      {
        distanceMeters: path.distance,
        durationSeconds: path.time / 1000,
        trafficSignals: countFeaturesNearRoute(input.features, routePoints, "traffic_signal"),
        crossings: countFeaturesNearRoute(input.features, routePoints, "crossing"),
        majorRoadMeters: majorRoadDistance(coordinates, path.details?.road_class),
      },
      summary,
    ),
    ...(summary ? { elevation: summary.elevation } : {}),
    provider: "graphhopper",
    warnings,
  };
}

async function requestGraphHopperPath(input: RouteRequest) {
  const attempts = input.avoidElevation ? [input, { ...input, avoidElevation: false }] : [input];
  let lastError: Error | undefined;

  for (const attempt of attempts) {
    try {
      return await postGraphHopper(attempt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("GraphHopper request failed");
      if (!input.avoidElevation || !isMissingSlopeModel(lastError) || !attempt.avoidElevation) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("GraphHopper request failed");
}

const MIN_GRAPHHOPPER_GAP_MS = 1_100;
const RATE_LIMIT_ATTEMPTS = 5;

let graphHopperChain: Promise<void> = Promise.resolve();
let graphHopperNotBefore = 0;

export function rateLimitDelayMs(attempt: number) {
  return Math.min(20_000, 15_000 + attempt * 5_000);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paceGraphHopper() {
  let release: () => void = () => undefined;
  const previous = graphHopperChain;
  graphHopperChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await previous;
    const wait = Math.max(0, graphHopperNotBefore - Date.now());
    if (wait > 0) await sleep(wait);
    graphHopperNotBefore = Date.now() + MIN_GRAPHHOPPER_GAP_MS;
  } finally {
    release();
  }
}

function holdGraphHopper(ms: number) {
  graphHopperNotBefore = Math.max(graphHopperNotBefore, Date.now() + ms);
}

async function postGraphHopper(input: RouteRequest) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < RATE_LIMIT_ATTEMPTS; attempt += 1) {
    await paceGraphHopper();
    try {
      return await requestGraphHopperOnce(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("GraphHopper request failed");
      if (!isGraphHopperRateLimit(lastError) || attempt === RATE_LIMIT_ATTEMPTS - 1) {
        throw lastError;
      }
      holdGraphHopper(rateLimitDelayMs(attempt));
    }
  }
  throw lastError ?? new Error("GraphHopper request failed");
}

async function requestGraphHopperOnce(input: RouteRequest) {
  const response = await fetch(
    `${env.GRAPHHOPPER_API_URL}/route?key=${encodeURIComponent(env.GRAPHHOPPER_API_KEY ?? "")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        input.mode === "direct"
          ? buildStandardGraphHopperRequest(input)
          : buildGraphHopperRequest(input),
      ),
      signal: AbortSignal.timeout(18_000),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GraphHopper request failed with ${response.status}: ${message.slice(0, 160)}`);
  }

  return graphHopperResponseSchema.parse(await response.json());
}

function isGraphHopperRateLimit(error: Error) {
  return error.message.includes("429") || /minutely api limit/i.test(error.message);
}

function isMissingSlopeModel(error: Error) {
  return /max_slope|average_slope|cannot compile|not available/i.test(error.message);
}
