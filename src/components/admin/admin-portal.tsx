"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand/app-logo";
import type { AgentAdminModelsResponse } from "@/lib/schemas/agent";

type AdminPortalProps = {
  signedIn: boolean;
  isAdmin: boolean;
  clerkId?: string | undefined;
};

export function AdminPortal({ signedIn, isAdmin, clerkId }: AdminPortalProps) {
  const [data, setData] = useState<AgentAdminModelsResponse>();
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void fetch("/api/admin/models")
      .then(async (response) => {
        const body = (await response.json()) as AgentAdminModelsResponse & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Models could not be loaded");
        if (!cancelled) setData(body);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Models could not be loaded");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function save(next: AgentAdminModelsResponse) {
    setIsSaving(true);
    setError(undefined);
    try {
      const response = await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabledModelIds: next.models.filter((model) => model.enabled).map((model) => model.id),
          defaultModelId: next.defaultModelId,
        }),
      });
      const body = (await response.json()) as AgentAdminModelsResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Models could not be saved");
      setData(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Models could not be saved");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleModel(id: string) {
    if (!data) return;
    const models = data.models.map((model) =>
      model.id === id ? { ...model, enabled: !model.enabled } : model,
    );
    const enabledIds = models.filter((model) => model.enabled).map((model) => model.id);
    const defaultModelId =
      data.defaultModelId && enabledIds.includes(data.defaultModelId)
        ? data.defaultModelId
        : enabledIds[0];
    void save({ models, defaultModelId });
  }

  function setDefault(id: string) {
    if (!data) return;
    void save({ ...data, defaultModelId: id });
  }

  return (
    <main className="min-h-dvh bg-[#0a0d0b] px-4 py-10 text-white">
      <section className="rws-panel mx-auto w-full max-w-lg p-5">
        <div className="mb-5 flex items-center gap-2 text-[#A8FF35]">
          <BrandMark className="size-5" />
          <p className="rws-kicker">Admin</p>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Agent models</h1>
        <p className="mt-1 text-xs text-white/55">
          Turn catalog models on or off. Chat only offers the ones you enable.
        </p>

        {!signedIn ? (
          <p className="mt-5 text-sm text-white/70">
            Sign in from the{" "}
            <Link href="/" className="text-[#A8FF35] underline-offset-2 hover:underline">
              planner
            </Link>{" "}
            first, then come back here.
          </p>
        ) : null}

        {signedIn && !isAdmin ? (
          <div className="mt-5 space-y-2 text-sm text-white/70">
            <p>This Clerk account is not on the admin allowlist.</p>
            <p>
              Add this user id to <code className="text-[#A8FF35]">ADMIN_USER_IDS</code>:
            </p>
            <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white">
              {clerkId}
            </p>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="mt-5 space-y-3">
            {error ? <p className="text-xs text-[#ffad91]">{error}</p> : null}
            {!data && !error ? <p className="text-xs text-white/55">Loading models…</p> : null}
            {data?.models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{model.label}</p>
                  <p className="truncate font-mono text-[11px] text-white/45">{model.id}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving || !model.enabled}
                    onClick={() => setDefault(model.id)}
                    className={`rounded-lg px-2 py-1 text-[11px] transition ${
                      data.defaultModelId === model.id
                        ? "bg-[#c8ff52]/15 text-[#A8FF35]"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => toggleModel(model.id)}
                    aria-pressed={model.enabled}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                      model.enabled
                        ? "bg-[#c8ff52] text-[#0a0d0b]"
                        : "border border-white/15 text-white/65"
                    }`}
                  >
                    {model.enabled ? "Active" : "Off"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-6 text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">
            Back to planner
          </Link>
        </p>
      </section>
    </main>
  );
}
