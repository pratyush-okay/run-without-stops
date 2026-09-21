import { AGENT_MODEL_CATALOG } from "@/lib/agent/catalog";
import {
  type ResolvedAgentSettings,
  resolveAgentSettings,
  sanitizeStoredSettings,
} from "@/lib/agent/settings";
import { getStoredAgentSettings, saveStoredAgentSettings } from "@/lib/supabase/agent-settings";

export async function getResolvedAgentSettings(): Promise<ResolvedAgentSettings> {
  const stored = await getStoredAgentSettings();
  return resolveAgentSettings(stored ?? null, AGENT_MODEL_CATALOG);
}

export async function updateAgentSettings(input: {
  enabledModelIds: string[];
  defaultModelId?: string | undefined;
}): Promise<ResolvedAgentSettings> {
  const sanitized = sanitizeStoredSettings(input, AGENT_MODEL_CATALOG);
  const saved = await saveStoredAgentSettings(sanitized);
  return resolveAgentSettings(saved ?? sanitized, AGENT_MODEL_CATALOG);
}
