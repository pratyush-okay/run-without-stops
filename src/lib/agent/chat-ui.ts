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

export function messageText(parts: readonly { type: string; text?: string }[]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}
