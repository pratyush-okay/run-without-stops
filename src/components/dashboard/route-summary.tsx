"use client";

import { type ReactNode, useEffect } from "react";
import { ElevationChart } from "@/components/dashboard/elevation-chart";
import {
  ClimbGlyph,
  CrossingsGlyph,
  DescentGlyph,
  MajorRoadGlyph,
  MetricsExpandGlyph,
  PaceGlyph,
  SignalsGlyph,
  TimeGlyph,
} from "@/components/dashboard/panel-marks";
import {
  displayPaceSeconds,
  distanceParts,
  durationFromPace,
  elevationParts,
  formatEffortDuration,
  formatPace,
  type MetricUnit,
  paceUnitLabel,
} from "@/lib/routing/format";
import type { RouteScrub } from "@/lib/routing/route-scrub";
import type { RouteResponse } from "@/lib/schemas/route";

type RouteSummaryProps = {
  route: RouteResponse | undefined;
  error: string | undefined;
  isRouting: boolean;
  unit: MetricUnit;
  paceSecondsPerKm: number;
  durationSeconds: number | undefined;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onNudgePace: (deltaSeconds: number) => void;
  onNudgeTime: (deltaSeconds: number) => void;
  scrub?: RouteScrub | undefined;
  onScrubChange?: ((scrub: RouteScrub | undefined) => void) | undefined;
};

function Stepper({
  label,
  icon,
  value,
  showLabel,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  showLabel: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
      {showLabel ? (
        <span className="mr-1 hidden items-center gap-1 text-[11px] text-white/40 md:inline-flex">
          {icon}
          {label}
        </span>
      ) : (
        <>
          <span className="sr-only">{label}</span>
          <span className="hidden md:inline">{icon}</span>
        </>
      )}
      <button
        type="button"
        className="grid size-7 place-items-center rounded-md text-white/40 hover:bg-white/8 hover:text-white md:size-8"
        onClick={onDecrease}
        aria-label={decreaseLabel}
      >
        −
      </button>
      <p
        className="min-w-[2.6rem] text-center font-mono text-[13px] text-white tabular-nums md:min-w-[3rem] md:text-[15px]"
        aria-live="polite"
      >
        {value}
      </p>
      <button
        type="button"
        className="grid size-7 place-items-center rounded-md text-white/40 hover:bg-white/8 hover:text-white md:size-8"
        onClick={onIncrease}
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  );
}

function Stat({
  label,
  icon,
  value,
  showLabel,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  showLabel: boolean;
}) {
  return (
    <p className="flex shrink-0 items-center gap-1 font-mono text-[12px] text-white tabular-nums md:gap-1.5 md:text-[13px]">
      <span className="shrink-0 text-white/55">{icon}</span>
      {showLabel ? (
        <span className="hidden text-[11px] text-white/40 md:inline">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
      {value}
    </p>
  );
}

function ExpandButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="ml-1 hidden size-8 shrink-0 place-items-center rounded-lg text-white/40 hover:bg-white/8 hover:text-white md:grid"
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse metrics" : "Expand metrics"}
      onClick={onToggle}
    >
      <MetricsExpandGlyph expanded={expanded} />
    </button>
  );
}

export function RouteSummary({
  route,
  error,
  isRouting,
  unit,
  paceSecondsPerKm,
  durationSeconds,
  expanded,
  onExpandedChange,
  onNudgePace,
  onNudgeTime,
  scrub,
  onScrubChange,
}: RouteSummaryProps) {
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const collapseOnMobile = () => {
      if (!media.matches) onExpandedChange(false);
    };
    collapseOnMobile();
    media.addEventListener("change", collapseOnMobile);
    return () => media.removeEventListener("change", collapseOnMobile);
  }, [onExpandedChange]);

  if (error) {
    return (
      <section className="rws-panel w-full px-3 py-2 text-sm text-[#ffad91] md:w-max">
        {error}
      </section>
    );
  }

  if (!route) {
    return (
      <section className="rws-panel w-full px-3 py-2 text-xs text-white/45 md:w-max md:px-3.5 md:py-2.5 md:text-sm">
        {isRouting ? "Finding your line…" : "Add a start and finish to see route intelligence."}
      </section>
    );
  }

  const distance = distanceParts(route.metrics.distanceMeters, unit);
  const major = distanceParts(route.metrics.majorRoadMeters, unit);
  const gain = elevationParts(route.metrics.ascentMeters ?? 0, unit);
  const loss = elevationParts(route.metrics.descentMeters ?? 0, unit);
  const pace = formatPace(displayPaceSeconds(paceSecondsPerKm, unit));
  const time = formatEffortDuration(
    durationSeconds ?? durationFromPace(route.metrics.distanceMeters, paceSecondsPerKm),
  );

  return (
    <section
      className={`rws-panel w-full overscroll-none select-none ${
        expanded
          ? "flex flex-col gap-2 px-2.5 py-2 md:gap-3 md:px-3.5 md:py-3"
          : "flex items-center gap-2 px-2.5 py-2 md:gap-3 md:px-3.5 md:py-2.5"
      }`}
      aria-label="Route metrics"
    >
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden overscroll-none md:gap-3">
          <p className="flex shrink-0 items-baseline gap-1" aria-live="polite">
            <span
              className={`font-mono leading-none font-semibold tracking-tight text-[#c8ff52] ${
                expanded ? "text-[2.35rem] md:text-[3.5rem]" : "text-[2.35rem] md:text-[3.25rem]"
              }`}
            >
              {distance.amount}
            </span>
            <span className="text-sm font-medium text-white/50 md:text-base">{distance.unit}</span>
          </p>

          <div className="h-6 w-px shrink-0 bg-white/8 md:h-7" />

          <Stepper
            label={`Pace ${paceUnitLabel(unit)}`}
            icon={<PaceGlyph />}
            value={pace}
            showLabel={expanded}
            onDecrease={() => onNudgePace(-5)}
            onIncrease={() => onNudgePace(5)}
            decreaseLabel="Faster pace"
            increaseLabel="Slower pace"
          />
          <Stepper
            label="Run time"
            icon={<TimeGlyph />}
            value={time}
            showLabel={expanded}
            onDecrease={() => onNudgeTime(-15)}
            onIncrease={() => onNudgeTime(15)}
            decreaseLabel="Shorter run time"
            increaseLabel="Longer run time"
          />

          <div className="h-6 w-px shrink-0 bg-white/8 md:h-7" />

          <Stat
            label="Gain"
            icon={<ClimbGlyph />}
            showLabel={expanded}
            value={route.metrics.ascentMeters === undefined ? "—" : `${gain.amount} ${gain.unit}`}
          />
          <Stat
            label="Loss"
            icon={<DescentGlyph />}
            showLabel={expanded}
            value={route.metrics.descentMeters === undefined ? "—" : `${loss.amount} ${loss.unit}`}
          />
          <Stat
            label="Signals"
            icon={<SignalsGlyph />}
            showLabel={expanded}
            value={String(route.metrics.trafficSignals)}
          />
          <Stat
            label="Crossings"
            icon={<CrossingsGlyph />}
            showLabel={expanded}
            value={String(route.metrics.crossings)}
          />
          <Stat
            label="Major road"
            icon={<MajorRoadGlyph />}
            showLabel={expanded}
            value={`${major.amount} ${major.unit}`}
          />

          {route.elevation && !expanded ? (
            <>
              <div className="hidden h-7 w-px shrink-0 bg-white/8 md:block" />
              <div className="hidden md:block">
                <ElevationChart
                  elevation={route.elevation}
                  unit={unit}
                  size="comfortable"
                  coordinates={route.coordinates}
                  scrub={scrub}
                  onScrubChange={onScrubChange}
                />
              </div>
              <div className="md:hidden">
                <ElevationChart
                  elevation={route.elevation}
                  unit={unit}
                  size="compact"
                  coordinates={route.coordinates}
                  scrub={scrub}
                  onScrubChange={onScrubChange}
                />
              </div>
            </>
          ) : null}
        </div>

        <ExpandButton expanded={expanded} onToggle={() => onExpandedChange(!expanded)} />
      </div>

      {route.elevation && expanded ? (
        <div className="hidden md:block">
          <ElevationChart
            elevation={route.elevation}
            unit={unit}
            size="expanded"
            coordinates={route.coordinates}
            scrub={scrub}
            onScrubChange={onScrubChange}
          />
        </div>
      ) : null}
    </section>
  );
}
