import { z } from "zod";

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const boundingBoxSchema = z
  .object({
    south: z.number().min(-90).max(90),
    west: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
  })
  .refine((box) => box.south < box.north && box.west < box.east, {
    message: "Bounding box coordinates are out of order",
  });

export const runnerFeatureKindSchema = z.enum(["traffic_signal", "crossing", "drinking_water"]);

export const runnerFeatureSchema = z.object({
  id: z.string().min(1),
  kind: runnerFeatureKindSchema,
  point: geoPointSchema,
  name: z.string().min(1).optional(),
  detail: z.string().min(1).optional(),
});

export const featuresResponseSchema = z.object({
  features: z.array(runnerFeatureSchema),
  attribution: z.string().min(1),
  partial: z.boolean(),
});

export type BoundingBox = z.infer<typeof boundingBoxSchema>;
export type GeoPoint = z.infer<typeof geoPointSchema>;
export type RunnerFeature = z.infer<typeof runnerFeatureSchema>;
export type RunnerFeatureKind = z.infer<typeof runnerFeatureKindSchema>;
export type FeaturesResponse = z.infer<typeof featuresResponseSchema>;
