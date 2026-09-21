import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/agent/admin";
import { getResolvedAgentSettings, updateAgentSettings } from "@/lib/agent/runtime";
import { reportError } from "@/lib/observability/report-error";
import { agentAdminModelsResponseSchema, agentAdminUpdateSchema } from "@/lib/schemas/agent";
import { apiErrorSchema } from "@/lib/schemas/api-error";

function toAdminResponse(settings: Awaited<ReturnType<typeof getResolvedAgentSettings>>) {
  return agentAdminModelsResponseSchema.parse({
    models: settings.models.map((model) => ({
      id: model.id,
      label: model.label,
      enabled: model.enabled,
    })),
    defaultModelId: settings.defaultModelId,
  });
}

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }
  if (!isAdminUser(user.id)) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Admin access required" }), {
      status: 403,
    });
  }

  try {
    return NextResponse.json(toAdminResponse(await getResolvedAgentSettings()));
  } catch (error) {
    reportError(error, { route: "/api/admin/models" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Models could not be loaded" }), {
      status: 500,
    });
  }
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }
  if (!isAdminUser(user.id)) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Admin access required" }), {
      status: 403,
    });
  }

  const parsed = agentAdminUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Choose which models are active" }), {
      status: 400,
    });
  }

  try {
    const settings = await updateAgentSettings(parsed.data);
    return NextResponse.json(toAdminResponse(settings));
  } catch (error) {
    reportError(error, { route: "/api/admin/models" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Models could not be saved" }), {
      status: 500,
    });
  }
}
