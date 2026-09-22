"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  BusyRoadMark,
  CrossingMark,
  HighwayMark,
  ParkMark,
  TrafficLightMark,
  WaterMark,
} from "@/components/dashboard/layer-marks";
import { LayersGlyph } from "@/components/dashboard/panel-marks";
import type { MapLayerVisibility } from "@/components/dashboard/running-map";

type LayerControlsProps = {
  layers: MapLayerVisibility;
  onToggle: (layer: keyof MapLayerVisibility) => void;
  isLoading: boolean;
};

const LAYER_META: {
  id: keyof MapLayerVisibility;
  label: string;
  mark: ReactNode;
}[] = [
  { id: "traffic_signal", label: "Traffic lights", mark: <TrafficLightMark /> },
  { id: "crossing", label: "Crossing", mark: <CrossingMark /> },
  { id: "drinking_water", label: "Water", mark: <WaterMark /> },
  { id: "parks", label: "Parks", mark: <ParkMark /> },
  { id: "highways", label: "Highways", mark: <HighwayMark /> },
  { id: "busy_roads", label: "Busy roads", mark: <BusyRoadMark /> },
];

export function LayerControls({ layers, onToggle, isLoading }: LayerControlsProps) {
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

  return (
    <section ref={rootRef} className="relative" aria-busy={isLoading} aria-label="On the map">
      <div className="rws-panel p-1.5">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-lg text-[#c8ff52] transition hover:bg-white/[0.06] hover:text-[#d6ff7a] md:size-10"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "Hide map layers" : "Show map layers"}
          title="On the map"
        >
          <LayersGlyph />
        </button>
      </div>
      <div
        id={listId}
        className={open ? "rws-panel absolute top-0 right-full z-10 mr-2 w-max p-1.5" : "hidden"}
      >
        <div className="flex flex-col gap-0.5">
          {LAYER_META.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`group flex min-h-11 items-center justify-start gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                layers[layer.id]
                  ? "bg-white/[0.08] text-white"
                  : "text-white/35 hover:bg-white/[0.04]"
              }`}
              onClick={() => onToggle(layer.id)}
              aria-pressed={layers[layer.id]}
              title={layer.label}
              aria-label={layer.label}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/20">
                {layer.mark}
              </span>
              <span className="whitespace-nowrap pr-2 text-xs">{layer.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
