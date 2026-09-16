"use client";

import type { ReactNode } from "react";
import {
  BusyRoadMark,
  CrossingMark,
  HighwayMark,
  ParkMark,
  TrafficLightMark,
  WaterMark,
} from "@/components/dashboard/layer-marks";
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
  return (
    <section className="rws-panel p-1.5 md:p-2" aria-busy={isLoading} aria-label="On the map">
      <div className="hidden items-center justify-between px-2 pt-1 pb-2 md:flex">
        <p className="rws-kicker">On the map</p>
      </div>
      <div className="flex flex-col gap-0.5">
        {LAYER_META.map((layer) => (
          <button
            key={layer.id}
            type="button"
            className={`group flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-1.5 py-1.5 text-left transition md:min-w-12 md:justify-start md:px-2.5 md:py-2 ${
              layers[layer.id]
                ? "bg-white/[0.08] text-white"
                : "text-white/35 hover:bg-white/[0.04]"
            }`}
            onClick={() => onToggle(layer.id)}
            aria-pressed={layers[layer.id]}
            title={layer.label}
            aria-label={layer.label}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/20 md:size-7">
              {layer.mark}
            </span>
            <span className="hidden whitespace-nowrap pr-2 text-xs md:block">{layer.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
