import { type ChatToolPart, routeToolSteps, toolNameFromPart } from "@/lib/agent/chat-ui";
import type { MetricUnit } from "@/lib/routing/format";
import { agentRouteProposalSchema } from "@/lib/schemas/agent";

export function ChatToolUse({
  part,
  unit = "metric",
}: {
  part: ChatToolPart;
  unit?: MetricUnit | undefined;
}) {
  const name = toolNameFromPart(part);
  const running = part.state === "input-streaming" || part.state === "input-available";
  const failed = part.state === "output-error";
  const parsed =
    name === "planRun" && part.state === "output-available"
      ? agentRouteProposalSchema.safeParse(part.output)
      : undefined;
  const steps = parsed?.success ? routeToolSteps(parsed.data, unit) : [];

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-2 text-[11px] leading-4 text-white/45">
        <span className="font-mono text-[10px] text-[#c8ff52]/90">{name}</span>
        <span>{running ? "Running" : failed ? "Failed" : "Done"}</span>
      </div>
      {steps.length > 0 ? (
        <div className="mt-1 space-y-0.5 border-l border-white/15 pl-2.5 text-xs leading-5 text-white/55">
          {steps.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
