"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentPublicModelsResponse } from "@/lib/schemas/agent";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [catalog, setCatalog] = useState<AgentPublicModelsResponse>();
  const [loadError, setLoadError] = useState<string>();
  const [modelId, setModelId] = useState<string>();
  const [input, setInput] = useState("");
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;

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

  if (!open) return null;

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 bg-[#050806]/50 md:hidden"
        aria-label="Close chat"
        onClick={onClose}
      />
      <aside className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-[min(24rem,100vw)] flex-col">
        <section className="rws-panel flex h-full flex-col rounded-none border-y-0 border-r-0 md:my-3 md:mr-3 md:rounded-2xl md:border">
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

          {catalog?.models.length ? (
            <label className="border-b border-white/10 px-4 py-2 text-[11px] text-white/50">
              Model
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#101512] px-2 py-1.5 text-xs text-white"
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
              >
                {catalog.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {loadError ? <p className="text-xs text-[#ffad91]">{loadError}</p> : null}
            {!loadError && catalog && catalog.models.length === 0 ? (
              <p className="text-xs text-white/55">No models are active yet.</p>
            ) : null}
            {messages.length === 0 && !loadError ? (
              <p className="text-xs text-white/55">Say hi. This chat can answer basic questions.</p>
            ) : null}
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="text-sm leading-relaxed">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="whitespace-pre-wrap text-white/85">
                    {message.parts
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join("")}
                  </p>
                </div>
              ))}
            </div>
            {error ? <p className="mt-3 text-xs text-[#ffad91]">Something went wrong.</p> : null}
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
                placeholder="Say hi"
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
        </section>
      </aside>
    </div>
  );
}
