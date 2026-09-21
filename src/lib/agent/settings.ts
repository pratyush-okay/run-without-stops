import { AGENT_MODEL_CATALOG, type AgentModel, findCatalogModel } from "@/lib/agent/catalog";

export type StoredAgentSettings = {
  enabledModelIds: string[] | null;
  defaultModelId: string | null;
};

export type ResolvedAgentModel = AgentModel & { enabled: boolean };

export type ResolvedAgentSettings = {
  models: ResolvedAgentModel[];
  enabledModels: ResolvedAgentModel[];
  defaultModelId: string | undefined;
};

export function resolveAgentSettings(
  stored: StoredAgentSettings | null | undefined,
  catalog: readonly AgentModel[] = AGENT_MODEL_CATALOG,
): ResolvedAgentSettings {
  const catalogIds = new Set(catalog.map((model) => model.id));
  const enabledIds =
    stored?.enabledModelIds == null
      ? new Set(catalog.filter((model) => model.enabledByDefault).map((model) => model.id))
      : new Set(stored.enabledModelIds.filter((id) => catalogIds.has(id)));

  const models = catalog.map((model) => ({
    ...model,
    enabled: enabledIds.has(model.id),
  }));
  const enabledModels = models.filter((model) => model.enabled);
  const requestedDefault = stored?.defaultModelId;
  const defaultModelId =
    requestedDefault && enabledIds.has(requestedDefault) ? requestedDefault : enabledModels[0]?.id;

  return { models, enabledModels, defaultModelId };
}

export function isEnabledModelId(modelId: string, settings: ResolvedAgentSettings): boolean {
  return settings.enabledModels.some((model) => model.id === modelId);
}

export function sanitizeStoredSettings(
  input: { enabledModelIds: string[]; defaultModelId?: string | undefined },
  catalog: readonly AgentModel[] = AGENT_MODEL_CATALOG,
): StoredAgentSettings {
  const catalogIds = new Set(catalog.map((model) => model.id));
  const enabledModelIds = [...new Set(input.enabledModelIds.filter((id) => catalogIds.has(id)))];
  const defaultModelId =
    input.defaultModelId && enabledModelIds.includes(input.defaultModelId)
      ? input.defaultModelId
      : (enabledModelIds[0] ?? null);

  return { enabledModelIds, defaultModelId };
}

export function modelSystemPrompt(
  modelId: string,
  catalog: readonly AgentModel[] = AGENT_MODEL_CATALOG,
) {
  return findCatalogModel(modelId, catalog)?.systemPrompt;
}
