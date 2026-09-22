"use client";

import { useEffect, useState } from "react";
import {
  type ChatToolPart,
  type RouteDecision,
  requestTextFromToolInput,
  routeDecisionHeadline,
  routeDecisions,
  toolNameFromPart,
} from "@/lib/agent/chat-ui";
import type { MetricUnit } from "@/lib/routing/format";
import { agentRouteProposalSchema } from "@/lib/schemas/agent";

const groups = [
  { id: "ask", label: "Request" },
  { id: "marker", label: "Markers" },
  { id: "line", label: "Line" },
] as const;

const statusLabel: Record<RouteDecision["status"], string> = {
  met: "Met",
  missed: "Missed",
  placed: "Placed",
  chosen: "Chose",
};

const statusClass: Record<RouteDecision["status"], string> = {
  met: "text-[#c8ff52]",
  missed: "text-[#ffad91]",
  placed: "text-white/55",
  chosen: "text-white/55",
};

function DecisionList({ decisions }: { decisions: readonly RouteDecision[] }) {
  return (
    <div className="mt-2 space-y-3">
      {groups.map((group) => {
        const rows = decisions.filter((decision) => decision.group === group.id);
        if (rows.length === 0) return null;
        return (
          <section key={group.id}>
            <p className="text-[10px] font-medium tracking-[0.14em] text-white/35 uppercase">
              {group.label}
            </p>
            <ul className="mt-1 space-y-1.5">
              {rows.map((decision) => (
                <li key={decision.id} className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 w-12 shrink-0 text-[10px] font-medium tracking-wide uppercase ${statusClass[decision.status]}`}
                  >
                    {statusLabel[decision.status]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-white/85">{decision.title}</span>
                    <span className="block text-[11px] leading-4 text-white/45">
                      {decision.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

const mapNotes: Record<string, string> = {
  clear: "Removed the stops and the street line.",
  undo: "Stepped back one edit.",
  redo: "Brought the edit back.",
  reverse: "Flipped the stops.",
  closeLoop: "Joined the end to the start.",
};

function mapActionNote(value: unknown) {
  if (!value || typeof value !== "object" || !("action" in value)) return undefined;
  const action = value.action;
  return typeof action === "string" ? mapNotes[action] : undefined;
}

const liveSteps = [
  { title: "Read the request", detail: "Checking distance, places, and style" },
  { title: "Place markers", detail: "Choosing the start and the stops" },
  { title: "Draw the street line", detail: "Snapping the loop onto walkable streets" },
];

export function ChatPlanLive({ requestText }: { requestText: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => Math.min(current + 1, liveSteps.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-[11px] leading-4 text-white/45">
        <span className="font-mono text-[10px] tracking-wide text-[#7ee8ff]">planRun</span>
        <span>Running</span>
      </div>
      {requestText ? (
        <p className="mt-1 line-clamp-2 pl-3 text-[11px] text-white/35">{requestText}</p>
      ) : null}
      <ol className="mt-1.5 space-y-1.5 border-l border-white/15 pl-3">
        {liveSteps.map((step, index) => {
          const state = index < active ? "Done" : index === active ? "Now" : "Next";
          return (
            <li key={step.title} className="flex items-start gap-2">
              <span
                className={`mt-0.5 w-12 shrink-0 text-[10px] font-medium tracking-wide uppercase ${
                  index === active ? "text-[#7ee8ff]" : "text-white/35"
                }`}
              >
                {state}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-white/80">{step.title}</span>
                <span className="block text-[11px] leading-4 text-white/40">{step.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

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
  const decisions = parsed?.success
    ? routeDecisions(parsed.data, { unit, requestText: requestTextFromToolInput(part.input) })
    : [];

  if (name === "planRun" && running) {
    return <ChatPlanLive requestText={requestTextFromToolInput(part.input)} />;
  }

  const headline = decisions.length > 0 ? routeDecisionHeadline(decisions) : "";
  const mapNote =
    name === "mapAction" && part.state === "output-available"
      ? (mapActionNote(part.output) ?? mapActionNote(part.input))
      : undefined;

  return (
    <details open className="group w-full min-w-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-0.5 text-[11px] leading-4 text-white/45 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-[10px] text-white/35 transition group-open:rotate-90">
          ▸
        </span>
        <span className="font-mono text-[10px] tracking-wide text-white/70">{name}</span>
        <span>{failed ? "Failed" : "Done"}</span>
        {headline ? <span className="min-w-0 truncate text-white/35">{headline}</span> : null}
      </summary>
      {decisions.length > 0 ? (
        <div className="mt-1.5 border-l border-white/15 pl-3">
          <DecisionList decisions={decisions} />
        </div>
      ) : mapNote ? (
        <p className="mt-1.5 border-l border-white/15 pl-3 text-[11px] leading-4 text-white/45">
          {mapNote}
        </p>
      ) : null}
    </details>
  );
}
