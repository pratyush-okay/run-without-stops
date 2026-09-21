import { z } from "zod";
import { MAX_ROUTE_POINTS } from "@/lib/routing/points";
import { geoPointSchema, runnerFeatureSchema } from "@/lib/schemas/features";

export const routeModeSchema = z.enum(["direct", "low_stops"]);

export const routeRequestSchema = z.object({
  points: z.array(geoPointSchema).min(2).max(MAX_ROUTE_POINTS),
  mode: routeModeSchema,
  avoidElevation: z.boolean().optional().default(false),
  features: z.array(runnerFeatureSchema).max(100).default([]),
});

export const routeMetricsSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  ascentMeters: z.number().nonnegative().optional(),
  descentMeters: z.number().nonnegative().optional(),
  minElevationMeters: z.number().optional(),
  maxElevationMeters: z.number().optional(),
  trafficSignals: z.number().int().nonnegative(),
  crossings: z.number().int().nonnegative(),
  drinkingWater: z.number().int().nonnegative().optional(),
  majorRoadMeters: z.number().nonnegative(),
  paceSecondsPerKm: z.number().min(150).max(720).optional(),
});

export const elevationMarkSchema = z.object({
  kind: z.enum(["climb", "descent"]),
  point: geoPointSchema,
  elevationMeters: z.number(),
});

export const elevationSampleSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  elevationMeters: z.number(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const routeElevationSchema = z.object({
  samples: z.array(elevationSampleSchema).min(2).max(240),
  marks: z.array(elevationMarkSchema).max(40),
});

export const routeResponseSchema = z.object({
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
  metrics: routeMetricsSchema,
  elevation: routeElevationSchema.optional(),
  provider: z.enum(["graphhopper", "valhalla"]),
  warnings: z.array(z.string()),
});

export type RouteMode = z.infer<typeof routeModeSchema>;
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export type RouteMetrics = z.infer<typeof routeMetricsSchema>;
export type ElevationMark = z.infer<typeof elevationMarkSchema>;
export type RouteElevation = z.infer<typeof routeElevationSchema>;
export type RouteResponse = z.infer<typeof routeResponseSchema>;
