import type { StoredAgentSettings } from "@/lib/agent/settings";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SETTINGS_ID = "default";

type AgentSettingsRow = {
  id: string;
  enabled_model_ids: string[] | null;
  default_model_id: string | null;
};

export async function getStoredAgentSettings(): Promise<StoredAgentSettings | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("agent_settings")
    .select("id, enabled_model_ids, default_model_id")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  const row = data as AgentSettingsRow;
  return {
    enabledModelIds: row.enabled_model_ids,
    defaultModelId: row.default_model_id,
  };
}

export async function saveStoredAgentSettings(settings: StoredAgentSettings) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("agent_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        enabled_model_ids: settings.enabledModelIds,
        default_model_id: settings.defaultModelId,
      },
      { onConflict: "id" },
    )
    .select("id, enabled_model_ids, default_model_id")
    .single();

  if (error) throw error;

  const row = data as AgentSettingsRow;
  return {
    enabledModelIds: row.enabled_model_ids,
    defaultModelId: row.default_model_id,
  } satisfies StoredAgentSettings;
}
