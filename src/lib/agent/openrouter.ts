import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/env";
import { SITE_NAME, siteOrigin } from "@/lib/seo/site";

export function hasOpenRouterKey() {
  return Boolean(env.OPENROUTER_API_KEY);
}

export function createAgentModel(modelId: string) {
  if (!env.OPENROUTER_API_KEY) return undefined;
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    appName: SITE_NAME,
    appUrl: siteOrigin(),
  });
  return openrouter(modelId);
}
