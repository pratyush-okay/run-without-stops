import { z } from "zod";
import { geoPointSchema } from "@/lib/schemas/features";

export const searchResultSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  point: geoPointSchema,
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema).max(8),
});

export const reverseResponseSchema = z.object({
  label: z.string().min(1),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type ReverseResponse = z.infer<typeof reverseResponseSchema>;
