"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapStyleMark } from "@/components/dashboard/map-style-marks";
import { MAP_STYLES, type MapStyleId } from "@/lib/maps/styles";

type MapStyleControlsProps = {
  styleId: MapStyleId;
  onChange: (id: MapStyleId) => void;
};

export function MapStyleControls({ styleId, onChange }: MapStyleControlsProps) {
  const listId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(id: MapStyleId) {
    onChange(id);
    setOpen(false);
  }

  return (
    <section
      ref={rootRef}
      className="rws-panel flex flex-col items-end p-1.5 md:flex-row-reverse md:items-center"
      aria-label="Map look"
    >
      <button
        type="button"
        className="grid size-11 shrink-0 place-items-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white/85"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? "Hide map looks" : "Show map looks"}
        title="Map look"
      >
        <MapStyleMark id={styleId} />
      </button>
      <div
        id={listId}
        className={
          open ? "mt-1 flex flex-col gap-0.5 md:mt-0 md:mr-1 md:flex-row md:items-center" : "hidden"
        }
      >
        {MAP_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={`grid size-11 place-items-center rounded-xl transition ${
              styleId === style.id
                ? "bg-white/[0.08] text-white"
                : "text-white/35 hover:bg-white/[0.04]"
            }`}
            onClick={() => choose(style.id)}
            aria-pressed={styleId === style.id}
            aria-label={style.label}
            title={style.label}
          >
            <MapStyleMark id={style.id} />
          </button>
        ))}
      </div>
    </section>
  );
}
