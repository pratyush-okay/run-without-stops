"use client";

import { useEffect, useId, useState } from "react";

type SaveRouteDialogProps = {
  suggestedName: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  isSaving?: boolean;
  error?: string | undefined;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function SaveRouteDialog({
  suggestedName,
  title = "Save this route",
  description = "Give it a name so you can come back to it, or share it as a link.",
  submitLabel = "Save route",
  isSaving = false,
  error,
  onClose,
  onSubmit,
}: SaveRouteDialogProps) {
  const titleId = useId();
  const [name, setName] = useState(suggestedName);

  useEffect(() => {
    setName(suggestedName);
  }, [suggestedName]);

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
        aria-label="Close save dialog"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rws-panel rws-sheet relative z-10 w-full p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-w-md md:pb-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="rws-kicker">Save</p>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-white/55">{description}</p>
          </div>
          <button type="button" className="rws-button px-2.5" onClick={onClose}>
            Close
          </button>
        </div>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(name);
          }}
        >
          <label className="grid gap-1.5 text-[11px] text-white/45">
            Route name
            <input
              className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none transition focus:border-[#c8ff52]/40 focus:ring-4 focus:ring-[#c8ff52]/10"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
            />
          </label>
          {error ? <p className="text-xs text-[#ffad91]">{error}</p> : null}
          <button
            type="submit"
            className="rws-button bg-[#c8ff52] text-[#101512] hover:bg-[#d6ff7a]"
            disabled={isSaving || name.trim().length === 0}
          >
            {isSaving ? "Saving…" : submitLabel}
          </button>
        </form>
      </section>
    </div>
  );
}
