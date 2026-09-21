"use client";

import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { DefaultChatTransport } from "ai";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChatMarkdown } from "@/components/agent/chat-markdown";
import {
  chatGreetingName,
  clampChatWidth,
  DEFAULT_CHAT_WIDTH,
  messageText,
  readStoredChatWidth,
  writeStoredChatWidth,
} from "@/lib/agent/chat-ui";
import type { AgentPublicModelsResponse } from "@/lib/schemas/agent";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { user } = useUser();
  const greetingName = chatGreetingName(user);
  const [catalog, setCatalog] = useState<AgentPublicModelsResponse>();
  const [loadError, setLoadError] = useState<string>();
  const [modelId, setModelId] = useState<string>();
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const modelIdRef = useRef(modelId);
  const widthRef = useRef(width);
  modelIdRef.current = modelId;
  widthRef.current = width;

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
        body: () => ({ modelId: modelIdRef.current }),
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

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

  const busy = status === "submitted" || status === "streaming";

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden border-white/10 bg-[#101512] ${
        open ? "border-l" : "w-0"
      } ${open && !dragging ? "transition-[width] duration-200 ease-out" : ""}`}
      style={open ? { width } : undefined}
      aria-hidden={!open}
      inert={!open}
    >
      {open ? (
        <button
          type="button"
          aria-label="Resize chat"
          onPointerDown={startResize}
          className="absolute inset-y-0 left-0 z-10 w-2 cursor-col-resize touch-none border-0 bg-transparent p-0 hover:bg-[#c8ff52]/20"
        />
      ) : null}

      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="rws-kicker">Agent</p>
          <h2 className="text-sm font-semibold tracking-tight">Chat</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs text-white/55 transition hover:text-white"
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
        <div className="space-y-3">
          {messages.map((message) => {
            const text = messageText(message.parts);
            const isUser = message.role === "user";
            return (
              <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {isUser ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#c8ff52] px-3 py-2 text-sm leading-relaxed text-[#0a0d0b]">
                    {text}
                  </div>
                ) : (
                  <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/[0.06] px-3 py-2 text-sm text-white/85">
                    <ChatMarkdown markdown={text} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {error ? (
          <p className="mt-3 text-xs text-[#ffad91]">
            {error.message || "Chat could not reply. Try again."}
          </p>
        ) : null}
      </div>

      <form
        className="border-t border-white/10 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const text = input.trim();
          if (!text || !modelId || busy) return;
          void sendMessage({ text }, { body: { modelId } });
          setInput("");
        }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!modelId || busy}
            placeholder="How can I help?"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
          />
          <button
            type="submit"
            disabled={!modelId || busy || !input.trim()}
            className="rounded-xl bg-[#c8ff52] px-3 py-2 text-xs font-medium text-[#0a0d0b] disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
