"use client";

import type { ReactNode } from "react";
import {
  CrossingsGlyph,
  DistanceGlyph,
  MajorRoadGlyph,
  PaceGlyph,
  SignalsGlyph,
  TimeGlyph,
} from "@/components/dashboard/panel-marks";
import {
  displayPaceSeconds,
  distanceParts,
  durationFromPace,
  formatEffortDuration,
  formatPace,
  type MetricUnit,
  paceUnitLabel,
} from "@/lib/routing/format";
import type { RouteResponse } from "@/lib/schemas/route";

type RouteSummaryProps = {
  route: RouteResponse | undefined;
  error: string | undefined;
  isRouting: boolean;
  unit: MetricUnit;
  paceSecondsPerKm: number;
  durationSeconds: number | undefined;
  onNudgePace: (deltaSeconds: number) => void;
  onNudgeTime: (deltaSeconds: number) => void;
};

function Heading({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-white/35 uppercase">
      {icon}
      {children}
    </p>
  );
}

function Stepper({
  label,
  icon,
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="min-w-0 px-1.5 md:border-r md:border-white/8 md:px-3">
      <Heading icon={icon}>{label}</Heading>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md text-white/40 hover:bg-white/8 hover:text-white"
          onClick={onDecrease}
          aria-label={decreaseLabel}
        >
          −
        </button>
        <p
          className="min-w-[5.4rem] text-center font-mono text-sm text-white tabular-nums md:text-base"
          aria-live="polite"
        >
          {value}
        </p>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md text-white/40 hover:bg-white/8 hover:text-white"
          onClick={onIncrease}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function RouteSummary({
  route,
  error,
  isRouting,
  unit,
  paceSecondsPerKm,
  durationSeconds,
  onNudgePace,
  onNudgeTime,
}: RouteSummaryProps) {
  if (error) {
    return <section className="rws-panel w-full px-4 py-3 text-sm text-[#ffad91]">{error}</section>;
  }

  if (!route) {
    return (
      <section className="rws-panel w-full px-4 py-3 text-xs text-white/45">
        {isRouting ? "Finding your line…" : "Add a start and finish to see route intelligence."}
      </section>
    );
  }

  const distance = distanceParts(route.metrics.distanceMeters, unit);
  const major = distanceParts(route.metrics.majorRoadMeters, unit);
  const pace = `${formatPace(displayPaceSeconds(paceSecondsPerKm, unit))} ${paceUnitLabel(unit)}`;
  const time = formatEffortDuration(
    durationSeconds ?? durationFromPace(route.metrics.distanceMeters, paceSecondsPerKm),
  );

  return (
    <section
      className="rws-panel flex w-full flex-col gap-3 px-3 py-3 md:flex-row md:items-stretch md:overflow-x-auto md:px-2 md:py-2.5"
      aria-label="Route metrics"
    >
      <div className="min-w-0 px-1.5 md:min-w-[10.5rem] md:border-r md:border-white/8 md:px-4">
        <Heading icon={<DistanceGlyph />}>Distance</Heading>
        <p className="mt-0.5 flex items-baseline gap-1.5" aria-live="polite">
          <span className="font-mono text-[2.15rem] leading-none font-semibold tracking-tight text-[#c8ff52] md:text-[2.7rem]">
            {distance.amount}
          </span>
          <span className="text-sm font-medium text-white/55 md:text-base">{distance.unit}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-y-2 md:flex md:flex-1 md:items-stretch">
        <Stepper
          label="Pace"
          icon={<PaceGlyph />}
          value={pace}
          onDecrease={() => onNudgePace(-5)}
          onIncrease={() => onNudgePace(5)}
          decreaseLabel="Faster pace"
          increaseLabel="Slower pace"
        />
        <Stepper
          label="Run time"
          icon={<TimeGlyph />}
          value={time}
          onDecrease={() => onNudgeTime(-15)}
          onIncrease={() => onNudgeTime(15)}
          decreaseLabel="Shorter run time"
          increaseLabel="Longer run time"
        />
        <Metric
          label="Signals"
          icon={<SignalsGlyph />}
          value={String(route.metrics.trafficSignals)}
        />
        <Metric
          label="Crossings"
          icon={<CrossingsGlyph />}
          value={String(route.metrics.crossings)}
        />
        <Metric
          label="Major road"
          icon={<MajorRoadGlyph />}
          value={`${major.amount} ${major.unit}`}
        />
      </div>
    </section>
  );
}

function Metric({ label, icon, value }: { label: string; icon: ReactNode; value: string }) {
  return (
    <div className="min-w-0 px-1.5 md:min-w-[6.2rem] md:border-r md:border-white/8 md:px-3 md:last:border-0">
      <Heading icon={icon}>{label}</Heading>
      <p className="mt-1 truncate font-mono text-sm text-white">{value}</p>
    </div>
  );
}
