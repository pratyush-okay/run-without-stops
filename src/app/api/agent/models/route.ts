import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canUseAgentChat } from "@/lib/agent/admin";
import { getResolvedAgentSettings } from "@/lib/agent/runtime";
import { runtimeModelId } from "@/lib/agent/settings";
import { reportError } from "@/lib/observability/report-error";
import { agentPublicModelsResponseSchema } from "@/lib/schemas/agent";
import { apiErrorSchema } from "@/lib/schemas/api-error";

export async function GET() {
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

  try {
    const settings = await getResolvedAgentSettings();
    return NextResponse.json(
      agentPublicModelsResponseSchema.parse({
        models: settings.enabledModels.map((model) => ({
          id: model.id,
          label: model.label,
        })),
        defaultModelId: runtimeModelId(settings),
      }),
    );
  } catch (error) {
    reportError(error, { route: "/api/agent/models" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Models could not be loaded" }), {
      status: 500,
    });
  }
}
