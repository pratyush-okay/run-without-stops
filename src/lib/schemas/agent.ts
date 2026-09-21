import { z } from "zod";
import { geoPointSchema } from "@/lib/schemas/features";
import { routeModeSchema, routeResponseSchema } from "@/lib/schemas/route";

export const agentModelIdSchema = z.string().min(1).max(120);

export const agentPublicModelSchema = z.object({
  id: agentModelIdSchema,
  label: z.string().min(1),
});

export const agentPublicModelsResponseSchema = z.object({
  models: z.array(agentPublicModelSchema),
  defaultModelId: agentModelIdSchema.optional(),
});

export const agentAdminModelSchema = agentPublicModelSchema.extend({
  enabled: z.boolean(),
});

export const agentAdminModelsResponseSchema = z.object({
  models: z.array(agentAdminModelSchema),
  defaultModelId: agentModelIdSchema.optional(),
});

export const agentAdminUpdateSchema = z.object({
  enabledModelIds: z.array(agentModelIdSchema),
  defaultModelId: agentModelIdSchema.optional(),
});

const agentMessagePartSchema = z
  .object({
    type: z.string().min(1),
  })
  .passthrough();

export const agentUiMessageSchema = z
  .object({
    id: z.string().min(1),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(agentMessagePartSchema).min(1),
  })
  .passthrough();

export const agentChatContextSchema = z.object({
  location: geoPointSchema.optional(),
  mapCenter: geoPointSchema.optional(),
  unit: z.enum(["metric", "imperial"]).optional(),
  paceSecondsPerKm: z.number().min(150).max(720).optional(),
  currentDistanceMeters: z.number().nonnegative().optional(),
});

export const agentChatRequestSchema = z.object({
  modelId: agentModelIdSchema.optional(),
  messages: z.array(agentUiMessageSchema).min(1),
  context: agentChatContextSchema.optional(),
});

export const agentPlanRunRequestSchema = z.object({
  text: z.string().min(1).max(4_000),
  context: agentChatContextSchema.optional(),
});

export const agentIncludedPlaceSchema = z.object({
  kind: z.enum(["park", "lake", "water", "place"]),
  name: z.string().min(1),
  point: geoPointSchema,
});

export const agentRouteProposalSchema = z.object({
  ok: z.literal(true),
  points: z.array(geoPointSchema).min(2).max(51),
  knownLabels: z.record(z.string(), z.string()),
  mode: routeModeSchema,
  avoidElevation: z.boolean(),
  targetMeters: z.number().nonnegative(),
  summary: z.string().min(1),
  included: z.array(agentIncludedPlaceSchema),
  route: routeResponseSchema.optional(),
});

export const agentRouteFailureSchema = z.object({
  ok: z.literal(false),
  error: z.string().min(1),
});

export const agentPlanRunResultSchema = z.union([
  agentRouteProposalSchema,
  agentRouteFailureSchema,
]);

export type AgentPublicModelsResponse = z.infer<typeof agentPublicModelsResponseSchema>;
export type AgentAdminModelsResponse = z.infer<typeof agentAdminModelsResponseSchema>;
export type AgentAdminUpdate = z.infer<typeof agentAdminUpdateSchema>;
export type AgentChatRequest = z.infer<typeof agentChatRequestSchema>;
export type AgentPlanRunRequest = z.infer<typeof agentPlanRunRequestSchema>;
export type AgentChatContext = z.infer<typeof agentChatContextSchema>;
export type AgentIncludedPlace = z.infer<typeof agentIncludedPlaceSchema>;
export type AgentRouteProposal = z.infer<typeof agentRouteProposalSchema>;
export type AgentPlanRunResult = z.infer<typeof agentPlanRunResultSchema>;
