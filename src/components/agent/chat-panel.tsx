"use client";

import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { DefaultChatTransport } from "ai";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChatMarkdown } from "@/components/agent/chat-markdown";
import { ChatToolUse } from "@/components/agent/chat-tool-use";
import {
  type ChatToolPart,
  chatGreetingName,
  clampChatWidth,
  combinedUserText,
  DEFAULT_CHAT_WIDTH,
  isPlanRunInFlight,
  isRouteBuildRequest,
  isToolPart,
  messageText,
  planRunProposalsFromParts,
  readStoredChatWidth,
  routeReplyText,
  toolNameFromPart,
  writeStoredChatWidth,
} from "@/lib/agent/chat-ui";
import {
  type AgentChatContext,
  type AgentPublicModelsResponse,
  type AgentRouteProposal,
  agentRouteProposalSchema,
} from "@/lib/schemas/agent";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
  context?: AgentChatContext;
  onApplyRoute?: (proposal: AgentRouteProposal) => void;
};

export function ChatPanel({ open, onClose, context, onApplyRoute }: ChatPanelProps) {
  const { user } = useUser();
  const greetingName = chatGreetingName(user);
  const [catalog, setCatalog] = useState<AgentPublicModelsResponse>();
  const [loadError, setLoadError] = useState<string>();
  const [modelId, setModelId] = useState<string>();
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const [planning, setPlanning] = useState(false);
  const modelIdRef = useRef(modelId);
  const widthRef = useRef(width);
  const contextRef = useRef(context);
  const appliedToolIds = useRef(new Set<string>());
  modelIdRef.current = modelId;
  widthRef.current = width;
  contextRef.current = context;

  useEffect(() => {
    setWidth(readStoredChatWidth());
  }, []);

  useEffect(() => {
    function onResize() {
      setWidth((current) => clampChatWidth(current));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.cursor = dragging ? "col-resize" : "";
    document.body.style.userSelect = dragging ? "none" : "";
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch("/api/agent/models")
      .then(async (response) => {
        const body = (await response.json()) as AgentPublicModelsResponse & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Models could not be loaded");
        if (cancelled) return;
        setCatalog(body);
        setModelId((current) => current ?? body.defaultModelId ?? body.models[0]?.id);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught.message : "Models could not be loaded");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent/chat",
        body: () => ({ modelId: modelIdRef.current, context: contextRef.current }),
      }),
    [],
  );
  const { messages, sendMessage, setMessages, status, error } = useChat({ transport });

  useEffect(() => {
    if (!onApplyRoute) return;
    for (const message of messages) {
      for (const found of planRunProposalsFromParts(message.parts)) {
        if (!found.toolCallId || appliedToolIds.current.has(found.toolCallId)) continue;
        appliedToolIds.current.add(found.toolCallId);
        onApplyRoute(found.proposal);
      }
    }
  }, [messages, onApplyRoute]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = widthRef.current;
    setDragging(true);

    function onMove(moveEvent: PointerEvent) {
      const next = clampChatWidth(startWidth + (startX - moveEvent.clientX));
      widthRef.current = next;
      setWidth(next);
    }

    function onUp() {
      setDragging(false);
      writeStoredChatWidth(widthRef.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const busy = status === "submitted" || status === "streaming" || planning;
  const buildingRoute = planning || messages.some((message) => isPlanRunInFlight(message.parts));
  const historyText = combinedUserText(messages);
  const draftIsRoute = isRouteBuildRequest(input.trim(), historyText);

  async function buildRouteFromChat(text: string) {
    const combined = [historyText, text].filter(Boolean).join("\n");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text }] },
    ]);
    setPlanning(true);
    try {
      const response = await fetch("/api/agent/plan-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: combined, context: contextRef.current }),
      });
      const body = (await response.json()) as AgentRouteProposal & { error?: string };
      const parsed = agentRouteProposalSchema.safeParse(body);
      if (!response.ok || !parsed.success) {
        throw new Error(body.error ?? "I could not build that loop.");
      }
      const proposal = parsed.data;
      const toolCallId = crypto.randomUUID();
      appliedToolIds.current.add(toolCallId);
      onApplyRoute?.(proposal);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [
            {
              type: "tool-planRun",
              toolCallId,
              state: "output-available",
              input: {},
              output: proposal,
            },
            { type: "text", text: routeReplyText(proposal) },
          ],
        },
      ]);
    } catch (caught: unknown) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [
            {
              type: "text",
              text: caught instanceof Error ? caught.message : "I could not build that loop.",
            },
          ],
        },
      ]);
    } finally {
      setPlanning(false);
    }
  }

  const sheetStyle = open ? ({ "--rws-chat-width": `${width}px` } as CSSProperties) : undefined;

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close chat"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#050806]/50 md:hidden"
        />
      ) : null}
      <aside
        className={`flex-col overflow-hidden bg-[#101512] ${
          open
            ? "fixed inset-x-0 bottom-0 z-50 flex h-[min(78dvh,calc(100dvh-4.5rem-env(safe-area-inset-top)))] rounded-t-2xl border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgb(0_0_0/0.45)] md:relative md:inset-auto md:z-auto md:h-full md:shrink-0 md:rounded-none md:border-t-0 md:border-l md:pb-0 md:shadow-none md:[width:var(--rws-chat-width)]"
            : "hidden md:flex md:h-full md:w-0 md:shrink-0"
        } ${open && !dragging ? "md:transition-[width] md:duration-200 md:ease-out" : ""}`}
        style={sheetStyle}
        aria-hidden={!open}
        inert={!open}
      >
        {open ? (
          <button
            type="button"
            aria-label="Resize chat"
            onPointerDown={startResize}
            className="absolute inset-y-0 left-0 z-10 hidden w-2 cursor-col-resize touch-none border-0 bg-transparent p-0 hover:bg-[#c8ff52]/20 md:block"
          />
        ) : null}

        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25 md:hidden"
          aria-hidden
        />

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="rws-kicker">Agent</p>
            <h2 className="text-sm font-semibold tracking-tight">Chat</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg px-3 text-sm text-white/70 transition hover:text-white md:min-h-0 md:px-2 md:py-1 md:text-xs md:text-white/55"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loadError ? <p className="text-xs text-[#ffad91]">{loadError}</p> : null}
          {!loadError && catalog && catalog.models.length === 0 ? (
            <p className="text-xs text-white/55">No models are active yet.</p>
          ) : null}
          {messages.length === 0 && !loadError ? (
            <div className="mb-4">
              <p className="text-base font-semibold tracking-tight">
                {greetingName ? `Hi, ${greetingName}` : "Hi"}
              </p>
              <p className="mt-1 text-sm text-white/55">How can I help you today?</p>
            </div>
          ) : null}
          <div className="min-w-0 space-y-3">
            {messages.map((message) => {
              if (message.role === "user") {
                const text = messageText(message.parts);
                return (
                  <div key={message.id} className="flex min-w-0 justify-end">
                    <div className="min-w-0 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#c8ff52] px-3 py-2 text-sm leading-relaxed text-[#0a0d0b]">
                      {text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={message.id} className="flex min-w-0 flex-col items-start gap-2">
                  {message.parts.map((part) => {
                    const toolPart = part as ChatToolPart;
                    if (isToolPart(toolPart)) {
                      return (
                        <ChatToolUse
                          key={toolPart.toolCallId || toolNameFromPart(toolPart)}
                          part={toolPart}
                          unit={context?.unit}
                        />
                      );
                    }
                    const text = messageText([part]).trim();
                    if (!text) return null;
                    return (
                      <div
                        key={text}
                        className="min-w-0 max-w-[92%] break-words rounded-2xl rounded-bl-md bg-white/[0.06] px-3 py-2 text-sm text-white/85"
                      >
                        <ChatMarkdown markdown={text} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {buildingRoute || (busy && messages.length > 0) ? (
            <p className="mt-3 text-xs text-white/45">
              {buildingRoute ? "Building a route…" : "Thinking…"}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-xs text-[#ffad91]">
              {error.message || "Chat could not reply. Try again."}
            </p>
          ) : null}
        </div>

        <form
          className="shrink-0 border-t border-white/10 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const text = input.trim();
            if (!text || busy) return;
            if (isRouteBuildRequest(text, historyText)) {
              setInput("");
              void buildRouteFromChat(text);
              return;
            }
            if (!modelId) return;
            void sendMessage({ text }, { body: { modelId, context: contextRef.current } });
            setInput("");
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              rows={2}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing)
                  return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
              disabled={busy || (!modelId && !draftIsRoute)}
              placeholder="Make a 5 km loop around me"
              className="max-h-32 min-h-[3.25rem] min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-5 text-white outline-none placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || (!modelId && !draftIsRoute)}
              className="min-h-11 rounded-xl bg-[#c8ff52] px-3 py-2 text-xs font-medium text-[#0a0d0b] disabled:opacity-40 md:min-h-0"
            >
              Send
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
