"use client";

import { useEffect, useRef } from "react";
import { SHORTCUT_ROWS } from "@/lib/maps/shortcuts";

export function ShortcutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-end justify-center p-3 pb-[calc(var(--rws-chrome-clearance)+0.75rem)] md:items-center md:pb-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-shortcuts-title"
        className="rws-panel pointer-events-auto w-full max-w-sm p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="rws-kicker">Map</p>
            <h2 id="map-shortcuts-title" className="mt-1 text-base font-semibold tracking-tight">
              Keyboard shortcuts
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <dl className="mt-3 space-y-2">
          {SHORTCUT_ROWS.map((row) => (
            <div key={row.keys} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="font-mono text-[11px] text-[#c8ff52]">{row.keys}</dt>
              <dd className="text-right text-white/75">{row.label}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
