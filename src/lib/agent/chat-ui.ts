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

export function isRouteBuildRequest(text: string, history = "") {
  if (hasRouteIntent(text)) return true;
  return /\b(try again|do it again)\b/i.test(text) && hasRouteIntent(history);
}

export function routeReplyText(proposal: { summary: string }) {
  return `${proposal.summary} It's on the map.`;
}

export type ChatToolPart = {
  type: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
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
