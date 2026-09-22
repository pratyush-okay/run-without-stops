import { inferLoopHints, targetMetersFromIntent, waypointLabelKey } from "@/lib/agent/plan-run";
import { distanceMeters } from "@/lib/geo";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  type MetricUnit,
} from "@/lib/routing/format";
import { type AgentRouteProposal, agentRouteProposalSchema } from "@/lib/schemas/agent";

export const DEFAULT_CHAT_WIDTH = 352;
export const MIN_CHAT_WIDTH = 280;
export const MAX_CHAT_WIDTH = 640;

const CHAT_WIDTH_STORAGE_KEY = "rws-chat-width";

function viewportWidth() {
  return typeof window === "undefined" ? 1280 : window.innerWidth;
}

export function clampChatWidth(width: number, viewWidth = viewportWidth()) {
  const max = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, Math.round(viewWidth * 0.72)));
  return Math.min(max, Math.max(MIN_CHAT_WIDTH, Math.round(width)));
}

export function readStoredChatWidth() {
  if (typeof window === "undefined") return DEFAULT_CHAT_WIDTH;
  try {
    const stored = Number(window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY));
    return Number.isFinite(stored) ? clampChatWidth(stored) : DEFAULT_CHAT_WIDTH;
  } catch {
    return DEFAULT_CHAT_WIDTH;
  }
}

export function writeStoredChatWidth(width: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(clampChatWidth(width)));
  } catch {
    return;
  }
}

export function chatGreetingName(
  user?: {
    firstName?: string | null;
    fullName?: string | null;
  } | null,
) {
  const first = user?.firstName?.trim();
  if (first) return first;
  const fromFull = user?.fullName?.trim().split(/\s+/)[0];
  return fromFull || undefined;
}

type ChatTextPart = { type?: string; text?: unknown };
type ChatTextMessage = {
  role: string;
  parts?: readonly ChatTextPart[];
  content?: unknown;
};

function partText(part: ChatTextPart) {
  return typeof part.text === "string" ? part.text : "";
}

export function messageText(parts: readonly ChatTextPart[] | undefined) {
  if (!parts?.length) return "";
  return parts.map(partText).join("");
}

function userMessageText(message: ChatTextMessage) {
  const fromParts = messageText(message.parts).trim();
  if (fromParts) return fromParts;
  return typeof message.content === "string" ? message.content.trim() : "";
}

export function lastUserText(messages: readonly ChatTextMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") return userMessageText(message);
  }
  return "";
}

export function combinedUserText(messages: readonly ChatTextMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => userMessageText(message))
    .filter(Boolean)
    .join("\n");
}

function hasRouteIntent(text: string) {
  return (
    /\b(loop|route|\brun\b|around me|around here)\b/i.test(text) ||
    /\d+(?:\.\d+)?\s*(k|km|mi|miles?|min|minutes?)\b/i.test(text) ||
    /\b(parks?|lakes?|water(?:\s+points?|\s+breaks?|\s+stops?)?|fountains?)\b/i.test(text)
  );
}

export const mapActions = ["clear", "undo", "redo", "reverse", "closeLoop"] as const;
export type MapAction = (typeof mapActions)[number];

const mapEdit =
  /\b(?:clear|undo|redo|reverse|flip|delete|erase|wipe|reset|scrap|start over|close(?:\s+the)?\s+loop)\b/i;
const question =
  /[?？]\s*$|^(?:why|what|how|who|when|where|can|could|should|would|is|are|do|does|did|tell me|explain)\b/i;

export function asksTheModel(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (question.test(trimmed)) return true;
  if (!mapEdit.test(trimmed)) return false;
  const restylesTheLine =
    /\b(?:hills?|lights?|traffic|highways?|elevation)\b/i.test(trimmed) &&
    !/\b(?:run|route|loop|line|map|it|this|that)\b/i.test(trimmed);
  return !restylesTheLine;
}

export function isRouteBuildRequest(text: string, history = "") {
  if (asksTheModel(text)) return false;
  if (hasRouteIntent(text)) return true;
  return /\b(try again|do it again)\b/i.test(text) && hasRouteIntent(history);
}

type RouteReplyProposal = {
  summary: string;
  targetMeters?: number | undefined;
  mode?: "direct" | "low_stops" | undefined;
  avoidElevation?: boolean | undefined;
  included?: readonly { name: string }[] | undefined;
  route?:
    | {
        metrics: {
          distanceMeters: number;
          durationSeconds: number;
          trafficSignals: number;
          crossings: number;
          ascentMeters?: number | undefined;
          drinkingWater?: number | undefined;
          majorRoadMeters?: number | undefined;
        };
      }
    | undefined;
};

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function throughStep(names: readonly string[]) {
  if (names.length === 0) return undefined;
  if (names.length === 1) return `Sent the loop through ${names[0]}.`;
  const last = names[names.length - 1];
  return `Sent the loop through ${names.slice(0, -1).join(", ")} and ${last}.`;
}

function modeStep(mode: RouteReplyProposal["mode"], avoidElevation: boolean | undefined) {
  const style =
    mode === "direct"
      ? "Chose Direct, following the stops in order"
      : mode === "low_stops"
        ? "Chose Low stops, preferring fewer lights"
        : undefined;
  if (style && avoidElevation) return `${style}, and kept it off the hills.`;
  if (style) return `${style}.`;
  if (avoidElevation) return "Kept the line off the hills.";
  return undefined;
}

function lineStep(proposal: RouteReplyProposal, unit: MetricUnit) {
  const metrics = proposal.route?.metrics;
  if (!metrics) return "Placed the stops on the map. A street line did not come back.";
  const facts = [
    countLabel(metrics.trafficSignals, "traffic light"),
    countLabel(metrics.crossings, "crossing"),
  ];
  if (metrics.ascentMeters != null && metrics.ascentMeters > 0) {
    facts.push(`${formatElevation(metrics.ascentMeters, unit)} up`);
  }
  if (metrics.drinkingWater) facts.push(countLabel(metrics.drinkingWater, "water stop"));
  if (metrics.majorRoadMeters != null && metrics.majorRoadMeters >= 100) {
    facts.push(`${formatDistance(metrics.majorRoadMeters, unit)} on major roads`);
  }
  return `Drew a ${formatDistance(metrics.distanceMeters, unit)} street line, about ${formatDuration(metrics.durationSeconds)}, with ${facts.join(", ")}.`;
}

export function routeReplyText(proposal: { summary: string }) {
  return `${proposal.summary} It's on the map.`;
}

export function routeToolSteps(proposal: RouteReplyProposal, unit: MetricUnit = "metric") {
  const names = [...new Set((proposal.included ?? []).map((place) => place.name).filter(Boolean))];
  const hasPlan =
    proposal.targetMeters != null ||
    proposal.mode != null ||
    Boolean(proposal.avoidElevation) ||
    names.length > 0 ||
    proposal.route != null;
  return [
    proposal.targetMeters != null
      ? `Aimed for ${formatDistance(proposal.targetMeters, unit)}.`
      : undefined,
    throughStep(names),
    modeStep(proposal.mode, proposal.avoidElevation),
    hasPlan ? lineStep(proposal, unit) : undefined,
  ].filter((step): step is string => Boolean(step));
}

const DISTANCE_TOLERANCE = 0.15;

export type RouteDecisionStatus = "met" | "missed" | "placed" | "chosen";

export type RouteDecision = {
  id: string;
  group: "ask" | "marker" | "line";
  title: string;
  detail: string;
  status: RouteDecisionStatus;
};

type RouteDecisionInput = {
  mode?: "direct" | "low_stops" | undefined;
  avoidElevation?: boolean | undefined;
  points?: readonly { lat: number; lng: number }[] | undefined;
  knownLabels?: Readonly<Record<string, string>> | undefined;
  included?:
    | readonly {
        kind?: string | undefined;
        name: string;
        point?: { lat: number; lng: number } | undefined;
      }[]
    | undefined;
  route?: RouteReplyProposal["route"];
};

function aroundPlace(text: string) {
  const match = text.match(/\baround\s+([a-z][\w\s'-]{1,48})/i);
  if (!match?.[1]) return undefined;
  const place = match[1]
    .replace(/\b(sydney|melbourne|australia)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!place || /^(me|here)$/i.test(place)) return undefined;
  return place;
}

function askedDistanceMeters(text: string) {
  const hints = inferLoopHints(text);
  if (hints.distanceKm == null && hints.distanceMiles == null && hints.durationMinutes == null) {
    return undefined;
  }
  return targetMetersFromIntent(hints);
}

const LABEL_REACH_METERS = 500;

function titledPlace(place: string) {
  return place.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function where(point: { lat: number; lng: number }) {
  const lat = `${Math.abs(point.lat).toFixed(4)}° ${point.lat >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(point.lng).toFixed(4)}° ${point.lng >= 0 ? "E" : "W"}`;
  return `${lat}, ${lng}`;
}

function onLine(
  item: { name: string; point?: { lat: number; lng: number } | undefined },
  points: readonly { lat: number; lng: number }[],
  labels: Readonly<Record<string, string>>,
) {
  if (Object.values(labels).some((label) => label.toLowerCase() === item.name.toLowerCase())) {
    return true;
  }
  const place = item.point;
  if (!place) return false;
  return points.some((point) => distanceMeters(place, point) <= LABEL_REACH_METERS);
}

function samePoint(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number } | undefined,
) {
  if (!right) return false;
  return waypointLabelKey(left) === waypointLabelKey(right);
}

export function routeDecisionHeadline(decisions: readonly RouteDecision[]) {
  const missed = decisions.filter(
    (decision) => decision.group === "ask" && decision.status === "missed",
  );
  if (missed.length === 0) return "The request is on the map";
  if (missed.length === 1) return "1 part of the request was not met";
  return `${missed.length} parts of the request were not met`;
}

export function routeDecisions(
  proposal: RouteDecisionInput,
  options?: { unit?: MetricUnit; requestText?: string },
) {
  const unit = options?.unit ?? "metric";
  const requestText = options?.requestText ?? "";
  const hints = inferLoopHints(requestText);
  const decisions: RouteDecision[] = [];
  const included = proposal.included ?? [];
  const drawn = proposal.route?.metrics.distanceMeters;
  const asked = requestText ? askedDistanceMeters(requestText) : undefined;

  if (asked != null) {
    const met =
      drawn != null &&
      drawn / asked >= 1 - DISTANCE_TOLERANCE &&
      drawn / asked <= 1 + DISTANCE_TOLERANCE;
    decisions.push({
      id: "ask-distance",
      group: "ask",
      title: "Distance",
      detail:
        drawn == null
          ? `Asked for ${formatDistance(asked, unit)}. The street line is not back yet.`
          : met
            ? `Asked for ${formatDistance(asked, unit)} and drew ${formatDistance(drawn, unit)}.`
            : `Asked for ${formatDistance(asked, unit)}, but the street line is ${formatDistance(drawn, unit)}.`,
      status: met ? "met" : "missed",
    });
  }

  const points = proposal.points ?? [];
  const labels = proposal.knownLabels ?? {};
  const place = aroundPlace(requestText);
  if (place) {
    const names = [
      ...Object.values(labels),
      ...included.filter((item) => onLine(item, points, labels)).map((item) => item.name),
    ];
    const label = titledPlace(place);
    const met = names.some((name) => name.toLowerCase().includes(place.toLowerCase()));
    decisions.push({
      id: "ask-place",
      group: "ask",
      title: label,
      detail: met ? `${label} is one of the markers.` : `${label} was not added as a marker.`,
      status: met ? "met" : "missed",
    });
  }

  const scenic = (id: string, title: string, kind: string, missing: string): RouteDecision => {
    const matches = included.filter((item) => item.kind === kind);
    const attached = matches.filter((item) => onLine(item, points, labels));
    const names = (attached.length > 0 ? attached : matches).map((item) => item.name).join(", ");
    if (attached.length > 0) {
      return { id, group: "ask", title, detail: `Added ${names}.`, status: "met" };
    }
    if (matches.length > 0) {
      const verb = names.includes(",") ? "were" : "was";
      return {
        id,
        group: "ask",
        title,
        detail: `${names} ${verb} picked, then left off the street line.`,
        status: "missed",
      };
    }
    return { id, group: "ask", title, detail: missing, status: "missed" };
  };
  if (hints.includePark) decisions.push(scenic("ask-park", "Park", "park", "No park was added."));
  if (hints.includeLake) decisions.push(scenic("ask-lake", "Lake", "lake", "No lake was added."));
  if (hints.includeWater) {
    decisions.push(scenic("ask-water", "Water", "water", "No drinking water was added."));
  }

  const wantsDirect = /\bdirect\b/i.test(requestText);
  const wantsFlat = /\b(flat|flatter|no hills|avoid hills)\b/i.test(requestText);
  if (proposal.mode === "low_stops") {
    decisions.push({
      id: "ask-mode",
      group: "ask",
      title: "Low stops",
      detail: "The line prefers fewer lights.",
      status: "met",
    });
  } else if (proposal.mode === "direct") {
    decisions.push({
      id: "ask-mode",
      group: "ask",
      title: "Direct",
      detail: wantsDirect
        ? "The line follows the stops in order."
        : "Low stops did not hold, so the line follows the stops in order.",
      status: wantsDirect ? "met" : "missed",
    });
  }
  if (wantsFlat || proposal.avoidElevation) {
    decisions.push({
      id: "ask-hills",
      group: "ask",
      title: "Hills",
      detail: proposal.avoidElevation ? "The line stays off the hills." : "Hills were not avoided.",
      status: proposal.avoidElevation ? "met" : wantsFlat ? "missed" : "chosen",
    });
  }

  const loop =
    points.length > 2 && samePoint(points[0] as { lat: number; lng: number }, points.at(-1));
  const body = loop ? points.slice(0, -1) : points;
  const placedNames = new Set<string>();
  body.forEach((point, index) => {
    const labeled = labels[waypointLabelKey(point)];
    const title =
      index === 0 ? (labeled ?? "Start") : labeled && labeled !== "Start" ? labeled : "Corner";
    if (labeled) placedNames.add(labeled);
    const stop = included.find((item) => item.name === title);
    const spot = where(point);
    decisions.push({
      id: `marker-${index}`,
      group: "marker",
      title,
      detail:
        index === 0
          ? `Start of the loop at ${spot}.`
          : stop?.kind
            ? `${stop.kind} stop at ${spot}.`
            : `Corner at ${spot}.`,
      status: "placed",
    });
  });
  for (const item of included) {
    if (placedNames.has(item.name) || onLine(item, points, labels)) continue;
    decisions.push({
      id: `marker-off-${item.name}`,
      group: "marker",
      title: item.name,
      detail: item.point
        ? `Picked near ${where(item.point)}, then left off the street line.`
        : "Picked for the loop, then left off the street line.",
      status: "missed",
    });
  }
  if (loop) {
    decisions.push({
      id: "marker-close",
      group: "marker",
      title: "Close the loop",
      detail: "The last marker returns to the start.",
      status: "placed",
    });
  }

  const metrics = proposal.route?.metrics;
  if (!metrics) {
    decisions.push({
      id: "line-missing",
      group: "line",
      title: "Street line",
      detail: "The stops are placed. A street line did not come back.",
      status: "missed",
    });
  } else {
    decisions.push({
      id: "line-length",
      group: "line",
      title: "Street line",
      detail: `${formatDistance(metrics.distanceMeters, unit)}, about ${formatDuration(metrics.durationSeconds)}.`,
      status: "chosen",
    });
    decisions.push({
      id: "line-lights",
      group: "line",
      title: "Lights and crossings",
      detail: `${countLabel(metrics.trafficSignals, "traffic light")}, ${countLabel(metrics.crossings, "crossing")}.`,
      status: "chosen",
    });
    if (metrics.ascentMeters != null && metrics.ascentMeters > 0) {
      decisions.push({
        id: "line-climb",
        group: "line",
        title: "Climb",
        detail: `${formatElevation(metrics.ascentMeters, unit)} up.`,
        status: "chosen",
      });
    }
    if (metrics.majorRoadMeters != null && metrics.majorRoadMeters >= 100) {
      decisions.push({
        id: "line-major",
        group: "line",
        title: "Major roads",
        detail: `${formatDistance(metrics.majorRoadMeters, unit)} of the line.`,
        status: "chosen",
      });
    }
  }

  return decisions;
}

export function requestTextFromToolInput(input: unknown) {
  if (!input || typeof input !== "object" || !("requestText" in input)) return "";
  const value = input.requestText;
  return typeof value === "string" ? value : "";
}

export function toolNameFromPart(part: ChatToolPart) {
  if (part.toolName) return part.toolName;
  if (part.type.startsWith("tool-")) return part.type.slice("tool-".length);
  return "tool";
}

export function isToolPart(part: ChatToolPart) {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export type ChatToolPart = {
  type: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

function isPlanRunPart(part: ChatToolPart) {
  return (
    part.type === "tool-planRun" || (part.type === "dynamic-tool" && part.toolName === "planRun")
  );
}

export function isPlanRunInFlight(parts: readonly ChatToolPart[]) {
  return parts.some(
    (part) =>
      isPlanRunPart(part) && (part.state === "input-streaming" || part.state === "input-available"),
  );
}

function mapActionValue(value: unknown): MapAction | undefined {
  if (!value || typeof value !== "object" || !("action" in value)) return undefined;
  const action = value.action;
  return typeof action === "string" && mapActions.includes(action as MapAction)
    ? (action as MapAction)
    : undefined;
}

export function mapActionsFromParts(parts: readonly ChatToolPart[]) {
  const found: { toolCallId: string; action: MapAction }[] = [];
  for (const part of parts) {
    if (toolNameFromPart(part) !== "mapAction" || part.state !== "output-available") continue;
    const action = mapActionValue(part.output) ?? mapActionValue(part.input);
    if (!part.toolCallId || !action) continue;
    found.push({ toolCallId: part.toolCallId, action });
  }
  return found;
}

export function planRunProposalsFromParts(parts: readonly ChatToolPart[]) {
  const proposals: { toolCallId: string; proposal: AgentRouteProposal }[] = [];
  for (const part of parts) {
    if (!isPlanRunPart(part) || part.state !== "output-available") continue;
    const parsed = agentRouteProposalSchema.safeParse(part.output);
    if (!parsed.success) continue;
    proposals.push({ toolCallId: part.toolCallId ?? "", proposal: parsed.data });
  }
  return proposals;
}
