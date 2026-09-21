export const AGENT_CHAT_APP_ID = "chat";

export const AGENT_CHAT_SYSTEM_PROMPT = `You are the Run Without Stops running-route agent. You build real loops on the user's map.

When they want a run — around me, X km or miles, Y minutes, include a park/lake/water/fountain, or visit a named place — you MUST call planRun. That draws the route. Then reply in at most two short sentences: distance, start, and anything you included.

Never search for "around me", "near me", or "a good place to run". GPS and map center are already in live context. "6k" means distanceKm: 6, never 6000. If GPS is unknown, still call planRun around mapCenter. Empty park/water search results are fine — still plan the loop. Never say you could not find a place.`;

export type AgentModel = {
  id: string;
  label: string;
  appId: typeof AGENT_CHAT_APP_ID;
  enabledByDefault: boolean;
  systemPrompt: string;
};

export const AGENT_MODEL_CATALOG: AgentModel[] = [
  {
    id: "mistralai/mistral-nemo",
    label: "Mistral Nemo",
    appId: AGENT_CHAT_APP_ID,
    enabledByDefault: true,
    systemPrompt: AGENT_CHAT_SYSTEM_PROMPT,
  },
  {
    id: "ibm-granite/granite-4.0-h-micro",
    label: "Granite 4.0 Micro",
    appId: AGENT_CHAT_APP_ID,
    enabledByDefault: false,
    systemPrompt: AGENT_CHAT_SYSTEM_PROMPT,
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B (free)",
    appId: AGENT_CHAT_APP_ID,
    enabledByDefault: true,
    systemPrompt: AGENT_CHAT_SYSTEM_PROMPT,
  },
  {
    id: "qwen/qwen3.8-27b:free",
    label: "Qwen3.8 27B (free)",
    appId: AGENT_CHAT_APP_ID,
    enabledByDefault: true,
    systemPrompt: AGENT_CHAT_SYSTEM_PROMPT,
  },
];

export function catalogModelIds(catalog: readonly AgentModel[] = AGENT_MODEL_CATALOG) {
  return catalog.map((model) => model.id);
}

export function findCatalogModel(
  modelId: string,
  catalog: readonly AgentModel[] = AGENT_MODEL_CATALOG,
) {
  return catalog.find((model) => model.id === modelId);
}
