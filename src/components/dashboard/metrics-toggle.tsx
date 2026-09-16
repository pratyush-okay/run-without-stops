"use client";

import type { MetricUnit } from "@/lib/routing/format";

type MetricsToggleProps = {
  unit: MetricUnit;
  onChange: (unit: MetricUnit) => void;
};

export function MetricsToggle({ unit, onChange }: MetricsToggleProps) {
  return (
    <fieldset
      className="m-0 flex h-10 shrink-0 items-center rounded-[0.85rem] border border-white/10 bg-[#101512]/82 p-0.5 backdrop-blur-xl"
      aria-label="Distance units"
    >
      {(
        [
          ["metric", "km"],
          ["imperial", "mi"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`min-h-8 rounded-lg px-2.5 text-[11px] font-semibold tracking-wider uppercase transition ${
            unit === value ? "bg-white text-[#101512]" : "text-white/45 hover:text-white"
          }`}
          aria-pressed={unit === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}
