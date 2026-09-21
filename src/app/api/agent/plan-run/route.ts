import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canUseAgentChat } from "@/lib/agent/admin";
import { agentChatErrorMessage } from "@/lib/agent/settings";
import { executePlanRun } from "@/lib/agent/tools";
import { reportError } from "@/lib/observability/report-error";
import { agentPlanRunRequestSchema, agentRouteProposalSchema } from "@/lib/schemas/agent";
import { apiErrorSchema } from "@/lib/schemas/api-error";

export const maxDuration = 120;

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

  const parsed = agentPlanRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Say how far you want to run" }), {
      status: 400,
    });
  }

  try {
    const proposal = await executePlanRun({}, parsed.data.context ?? {}, {
      userText: parsed.data.text,
    });
    return NextResponse.json(agentRouteProposalSchema.parse(proposal));
  } catch (error) {
    reportError(error, { route: "/api/agent/plan-run" });
    return NextResponse.json(apiErrorSchema.parse({ error: agentChatErrorMessage(error) }), {
      status: 500,
    });
  }
}
