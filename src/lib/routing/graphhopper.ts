import { z } from "zod";
import { env } from "@/env";
import { countFeaturesNearRoute, distanceMeters, signalAvoidancePolygons } from "@/lib/geo";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteRequest, RouteResponse } from "@/lib/schemas/route";

const graphHopperPathSchema = z.object({
  distance: z.number(),
  time: z.number(),
  ascend: z.number().optional(),
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

  const response = await fetch(
    `${env.GRAPHHOPPER_API_URL}/route?key=${encodeURIComponent(env.GRAPHHOPPER_API_KEY)}`,
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

  const payload = graphHopperResponseSchema.parse(await response.json());
  const path = payload.paths[0];
  if (!path) throw new Error("GraphHopper returned no route");

  const coordinates: [number, number][] = path.points.coordinates.map(([lng, lat]) => [lng, lat]);
  const routePoints: GeoPoint[] = coordinates.map(([lng, lat]) => ({ lat, lng }));
  const warnings: string[] = [];
  if (input.features.length === 0) {
    warnings.push("Stop counts are unavailable until nearby map data loads.");
  }

  return {
    coordinates,
    metrics: {
      distanceMeters: path.distance,
      durationSeconds: path.time / 1000,
      ...(path.ascend !== undefined ? { ascentMeters: path.ascend } : {}),
      trafficSignals: countFeaturesNearRoute(input.features, routePoints, "traffic_signal"),
      crossings: countFeaturesNearRoute(input.features, routePoints, "crossing"),
      majorRoadMeters: majorRoadDistance(coordinates, path.details?.road_class),
    },
    provider: "graphhopper",
    warnings,
  };
}
