import { currentUser } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { canUseAgentChat } from "@/lib/agent/admin";
import { AGENT_CHAT_SYSTEM_PROMPT } from "@/lib/agent/catalog";
import { createAgentModel, hasOpenRouterKey } from "@/lib/agent/openrouter";
import { getResolvedAgentSettings } from "@/lib/agent/runtime";
import {
  agentChatErrorMessage,
  fallbackModelIds,
  modelSystemPrompt,
  runtimeModelId,
} from "@/lib/agent/settings";
import { reportError } from "@/lib/observability/report-error";
import { agentChatRequestSchema } from "@/lib/schemas/agent";
import { apiErrorSchema } from "@/lib/schemas/api-error";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }
  if (!canUseAgentChat(user.id)) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Admin access required" }), {
      status: 403,
    });
  }

  if (!hasOpenRouterKey()) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Chat is not configured" }), {
      status: 503,
    });
  }

  const parsed = agentChatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Send a message" }), {
      status: 400,
    });
  }

  try {
    const settings = await getResolvedAgentSettings();
    const modelId = runtimeModelId(settings);
    if (!modelId) {
      return NextResponse.json(apiErrorSchema.parse({ error: "No models are active" }), {
        status: 400,
      });
    }

    const fallbackIds = fallbackModelIds(modelId, settings);
    const model = createAgentModel(modelId, fallbackIds);
    if (!model) {
      return NextResponse.json(apiErrorSchema.parse({ error: "Chat is not configured" }), {
        status: 503,
      });
    }

    const result = streamText({
      model,
      instructions: modelSystemPrompt(modelId) ?? AGENT_CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(parsed.data.messages as UIMessage[]),
      maxRetries: 1,
      onError: ({ error }) => {
        reportError(error, { route: "/api/agent/chat" });
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: agentChatErrorMessage,
      }),
    });
  } catch (error) {
    reportError(error, { route: "/api/agent/chat" });
    return NextResponse.json(apiErrorSchema.parse({ error: agentChatErrorMessage(error) }), {
      status: 500,
    });
  }
}
