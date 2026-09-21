import { z } from "zod";

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

export const agentChatRequestSchema = z.object({
  modelId: agentModelIdSchema,
  messages: z.array(agentUiMessageSchema).min(1),
});

export type AgentPublicModelsResponse = z.infer<typeof agentPublicModelsResponseSchema>;
export type AgentAdminModelsResponse = z.infer<typeof agentAdminModelsResponseSchema>;
export type AgentAdminUpdate = z.infer<typeof agentAdminUpdateSchema>;
export type AgentChatRequest = z.infer<typeof agentChatRequestSchema>;
