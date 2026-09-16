import { z } from "zod";
import { MAX_ROUTE_POINTS } from "@/lib/routing/points";
import { geoPointSchema, runnerFeatureSchema } from "@/lib/schemas/features";

export const routeModeSchema = z.enum(["direct", "low_stops"]);

export const routeRequestSchema = z.object({
  points: z.array(geoPointSchema).min(2).max(MAX_ROUTE_POINTS),
  mode: routeModeSchema,
  features: z.array(runnerFeatureSchema).max(100).default([]),
});

export const routeMetricsSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  ascentMeters: z.number().nonnegative().optional(),
  trafficSignals: z.number().int().nonnegative(),
  crossings: z.number().int().nonnegative(),
  majorRoadMeters: z.number().nonnegative(),
});

export const routeResponseSchema = z.object({
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
  metrics: routeMetricsSchema,
  provider: z.enum(["graphhopper", "valhalla"]),
  warnings: z.array(z.string()),
});

export type RouteMode = z.infer<typeof routeModeSchema>;
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export type RouteMetrics = z.infer<typeof routeMetricsSchema>;
export type RouteResponse = z.infer<typeof routeResponseSchema>;
