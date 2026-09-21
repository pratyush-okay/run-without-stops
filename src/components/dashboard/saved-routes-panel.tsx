"use client";

import { useEffect, useId, useState } from "react";
import { savedRouteStatLine } from "@/lib/routes/saved-route-stats";
import type { MetricUnit } from "@/lib/routing/format";
import type { SavedRouteSummary } from "@/lib/schemas/saved-route";

type SavedRoutesPanelProps = {
  routes: SavedRouteSummary[];
  isLoading: boolean;
  error?: string | undefined;
  unit: MetricUnit;
  onClose: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
};

export function SavedRoutesPanel({
  routes,
  isLoading,
  error,
  unit,
  onClose,
  onLoad,
  onDelete,
  onRename,
}: SavedRoutesPanelProps) {
  const titleId = useId();
  const [editingId, setEditingId] = useState<string>();
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid items-end justify-center bg-[#050806]/72 px-0 backdrop-blur-sm md:place-items-center md:items-center md:px-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close saved routes"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rws-panel rws-sheet relative z-10 flex max-h-[min(36rem,calc(100dvh-env(safe-area-inset-top)-1rem))] w-full flex-col overflow-hidden p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-w-md md:pb-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="rws-kicker">Library</p>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              Saved routes
            </h2>
            <p className="mt-1 text-xs text-white/55">Open one, rename it, or delete it.</p>
          </div>
          <button type="button" className="rws-button px-2.5" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isLoading ? (
            <p className="text-sm text-white/45">Loading your routes…</p>
          ) : error ? (
            <p className="text-sm text-[#ffad91]">{error}</p>
          ) : routes.length === 0 ? (
            <p className="text-sm text-white/45">
              No saved routes yet. Save a planned line to keep it and get a shareable link.
            </p>
          ) : (
            <ul className="space-y-2">
              {routes.map((route) => (
                <li key={route.id} className="rounded-xl bg-white/[0.045] p-3">
                  {editingId === route.id ? (
                    <form
                      className="grid gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        onRename(route.id, draftName);
                        setEditingId(undefined);
                      }}
                    >
                      <input
                        className="h-10 rounded-lg border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none focus:border-[#c8ff52]/40"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        maxLength={80}
                        aria-label="Route name"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="rws-button min-h-9 flex-1">
                          Save name
                        </button>
                        <button
                          type="button"
                          className="rws-button min-h-9 flex-1"
                          onClick={() => setEditingId(undefined)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          onLoad(route.id);
                          onClose();
                        }}
                      >
                        <p className="truncate text-sm font-medium text-white">{route.name}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
                          {savedRouteStatLine(route, unit)}
                        </p>
                      </button>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="rws-button min-h-9 flex-1"
                          onClick={() => {
                            setEditingId(route.id);
                            setDraftName(route.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="rws-button min-h-9 flex-1 text-[#ffad91]"
                          onClick={() => onDelete(route.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
