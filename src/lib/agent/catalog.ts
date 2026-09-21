export const AGENT_CHAT_APP_ID = "chat";

export const AGENT_CHAT_SYSTEM_PROMPT =
  "You are a friendly assistant for Run Without Stops, a running route planner. Greet people warmly, answer basic questions in a short helpful way, and say you cannot plan routes yet if they ask for one.";

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
