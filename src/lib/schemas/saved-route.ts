import { z } from "zod";
import { MAX_ROUTE_POINTS, MAX_ROUTE_STOPS } from "@/lib/routing/points";
import { geoPointSchema } from "@/lib/schemas/features";
import { routeModeSchema, routeResponseSchema } from "@/lib/schemas/route";

export const MAX_SAVED_ROUTE_COORDINATES = 16_000;

export const savedRouteNameSchema = z
  .string()
  .trim()
  .min(1, "Name this route")
  .max(80, "Keep the name under 80 characters");

export const shareSlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]{8,16}$/, "Invalid share link");

const knownLabelsSchema = z
  .record(z.string().max(80), z.string().max(160))
  .refine((value) => Object.keys(value).length <= MAX_ROUTE_STOPS, "Too many place labels");

const persistableRouteSchema = routeResponseSchema.extend({
  coordinates: z
    .array(z.tuple([z.number(), z.number()]))
    .min(2)
    .max(MAX_SAVED_ROUTE_COORDINATES),
  warnings: z.array(z.string().max(240)).max(20),
});

export const saveRouteRequestSchema = z.object({
  name: savedRouteNameSchema,
  points: z.array(geoPointSchema).min(2).max(MAX_ROUTE_POINTS),
  knownLabels: knownLabelsSchema.default({}),
  mode: routeModeSchema,
  route: persistableRouteSchema,
});

export const renameRouteRequestSchema = z.object({
  name: savedRouteNameSchema,
});

export const savedRouteSummarySchema = z.object({
  id: z.string().uuid(),
  name: savedRouteNameSchema,
  shareSlug: shareSlugSchema,
  sharePath: z.string().min(1),
  mode: routeModeSchema,
  distanceMeters: z.number().nonnegative(),
  trafficSignals: z.number().int().nonnegative(),
  crossings: z.number().int().nonnegative(),
  drinkingWater: z.number().int().nonnegative().optional(),
  ascentMeters: z.number().nonnegative().optional(),
  descentMeters: z.number().nonnegative().optional(),
  majorRoadMeters: z.number().nonnegative(),
  paceSecondsPerKm: z.number().min(150).max(720).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const savedRouteSchema = savedRouteSummarySchema.extend({
  points: z.array(geoPointSchema).min(2).max(MAX_ROUTE_POINTS),
  knownLabels: knownLabelsSchema,
  route: persistableRouteSchema,
});

export const savedRouteListResponseSchema = z.object({
  routes: z.array(savedRouteSummarySchema),
});

export type SaveRouteRequest = z.infer<typeof saveRouteRequestSchema>;
export type SavedRoute = z.infer<typeof savedRouteSchema>;
export type SavedRouteSummary = z.infer<typeof savedRouteSummarySchema>;
