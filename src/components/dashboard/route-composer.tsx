"use client";

import { useRef, useState } from "react";
import { LocationGlyph, MetricsExpandGlyph } from "@/components/dashboard/panel-marks";
import { RoutePersistActions } from "@/components/dashboard/route-actions";
import { WaypointBadge } from "@/components/dashboard/waypoint-marks";
import { pointLabelKey, usePointLabels } from "@/hooks/use-point-labels";
import { displayedRouteFeatureCounts } from "@/lib/maps/route-feature-counts";
import { formatDistance, type MetricUnit } from "@/lib/routing/format";
import { MAX_ROUTE_STOPS } from "@/lib/routing/points";
import { visibleWaypoints } from "@/lib/routing/waypoints";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import type { RouteMode, RouteResponse } from "@/lib/schemas/route";

type RouteComposerProps = {
  points: GeoPoint[];
  knownLabels: Record<string, string>;
  mode: RouteMode;
  avoidElevation: boolean;
  route: RouteResponse | undefined;
  error: string | undefined;
  isRouting: boolean;
  features: RunnerFeature[];
  layers: Partial<Record<RunnerFeature["kind"], boolean>>;
  onModeChange: (mode: RouteMode) => void;
  onAvoidElevationChange: (avoid: boolean) => void;
  onRemovePoint: (index: number) => void;
  onFocusPoint: (point: GeoPoint) => void;
  onUseLocation: () => void;
  unit: MetricUnit;
  durationSeconds: number | undefined;
  savedRouteName?: string | undefined;
  shareReady?: boolean;
  shareCopied?: boolean;
  shareError?: string | undefined;
  onRequestSave?: (suggestedName: string) => void;
  onRequestShare?: (suggestedName: string) => void;
};

export function RouteComposer({
  points,
  knownLabels,
  mode,
  avoidElevation,
  route,
  error,
  isRouting,
  features,
  layers,
  onModeChange,
  onAvoidElevationChange,
  onRemovePoint,
  onFocusPoint,
  onUseLocation,
  unit,
  durationSeconds,
  savedRouteName,
  shareReady = false,
  shareCopied = false,
  shareError,
  onRequestSave,
  onRequestShare,
}: RouteComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const labels = usePointLabels(points, knownLabels);
  const marks = visibleWaypoints(points);
  const onRoute = displayedRouteFeatureCounts(
    features,
    (route?.coordinates ?? []).map(([lng, lat]) => ({ lng, lat })),
    layers,
    points,
  );

  const headline =
    points.length === 0
      ? undefined
      : points.length === 1
        ? "Start set. Add a finish."
        : isRouting
          ? "Finding your line…"
          : route
            ? `${formatDistance(route.metrics.distanceMeters, unit)} · ${onRoute.trafficSignals} lights`
            : `${points.length} points`;

  return (
    <section
      className={`rws-panel flex flex-col overflow-hidden md:max-h-[min(32rem,calc(100dvh-13rem))] md:w-full md:p-4 ${
        expanded
          ? "max-h-[min(34rem,calc(100dvh-11rem))] w-[min(24rem,calc(100cqi-5.25rem))] p-3"
          : "w-max max-w-[min(18rem,calc(100cqi-5.25rem))] p-1.5"
      }`}
      aria-label="Route builder"
    >
      <button
        type="button"
        className={`flex w-full shrink-0 items-center justify-between gap-3 rounded-xl text-left transition md:pointer-events-none md:cursor-default ${
          expanded ? "items-start" : "min-h-11 px-2.5 hover:bg-white/[0.06]"
        }`}
        onClick={() => {
          setExpanded((open) => {
            const next = !open;
            if (next) {
              window.requestAnimationFrame(() => detailsRef.current?.scrollTo(0, 0));
            }
            return next;
          });
        }}
        aria-expanded={expanded}
        aria-controls="route-builder-details"
      >
        <div className="min-w-0">
          <p className="rws-kicker">Route builder</p>
          {headline ? (
            <p className={`mt-1 text-sm text-white/60 ${expanded ? "block" : "hidden md:block"}`}>
              {headline}
            </p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {isRouting ? (
            <span className="rws-pulse" role="status" aria-label="Calculating route" />
          ) : null}
          <span className="grid size-9 place-items-center rounded-lg bg-white/[0.08] text-[#c8ff52] md:hidden">
            <MetricsExpandGlyph expanded={!expanded} />
            <span className="sr-only">
              {expanded ? "Hide route builder" : "Show route builder"}
            </span>
          </span>
        </span>
      </button>

      <div
        ref={detailsRef}
        id="route-builder-details"
        className={
          expanded
            ? "mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain md:overflow-hidden"
            : "mt-3 hidden min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain md:flex md:overflow-hidden"
        }
      >
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {(["direct", "low_stops"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`min-h-10 rounded-lg px-3 py-2 text-xs font-medium transition ${
                mode === option
                  ? "bg-white text-[#101512] shadow-sm"
                  : "text-white/55 hover:text-white"
              }`}
              onClick={() => onModeChange(option)}
            >
              {option === "direct" ? "Direct" : "Low stops"}
            </button>
          ))}
        </div>
        {mode === "low_stops" ? (
          <button
            type="button"
            className={`mt-2 flex min-h-10 w-full min-w-0 max-w-full shrink-0 items-center justify-between rounded-xl border px-3 text-left text-xs transition ${
              avoidElevation
                ? "border-[#c8ff52]/35 bg-[#c8ff52]/12 text-[#c8ff52]"
                : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.07] hover:text-white"
            }`}
            aria-pressed={avoidElevation}
            onClick={() => onAvoidElevationChange(!avoidElevation)}
          >
            <span>Avoid hills</span>
            <span className="font-mono text-[10px] tracking-wider uppercase">
              {avoidElevation ? "On" : "Off"}
            </span>
          </button>
        ) : null}

        <div className="mt-3 flex shrink-0 flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
          {points.length === 0 ? (
            <div className="shrink-0 rounded-xl border border-dashed border-white/15 px-3 py-3">
              <p className="text-sm leading-5 text-white/55">
                Click the map, search a place, or start from where you are.
              </p>
              <button
                type="button"
                className="mt-3 hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c8ff52]/10 text-[13px] font-medium text-[#c8ff52] ring-1 ring-[#c8ff52]/30 transition hover:bg-[#c8ff52]/16 md:flex"
                onClick={onUseLocation}
              >
                <LocationGlyph />
                Use my location
              </button>
            </div>
          ) : (
            <ol className="max-h-[min(12rem,calc(100dvh-28rem))] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 md:min-h-0 md:max-h-[min(20rem,calc(100dvh-24rem))] md:flex-1">
              {marks.map((mark) => (
                <li key={`${mark.role}:${pointLabelKey(mark.point)}:${mark.index}`}>
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.045] py-1.5 pr-1.5 pl-2.5">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => onFocusPoint(mark.point)}
                    >
                      <WaypointBadge role={mark.role} label={mark.label} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white/85">
                          {labels[mark.index] ?? "Pinned place"}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-white/30">
                          {mark.title}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-white/35 hover:bg-white/8 hover:text-white"
                      onClick={() => onRemovePoint(mark.index)}
                      aria-label={`Remove ${mark.title}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {marks.length >= MAX_ROUTE_STOPS ? (
            <p className="mt-2 shrink-0 text-[11px] text-white/45">
              Cannot add more than {MAX_ROUTE_STOPS} checkpoints. Remove one to add another.
            </p>
          ) : null}

          {route ? (
            <p className="mt-2 shrink-0 text-[11px] text-white/40">
              {onRoute.drinkingWater} drinking water near this line.
            </p>
          ) : null}

          {error ? <p className="mt-3 shrink-0 text-sm text-[#ffad91]">{error}</p> : null}
        </div>

        <RoutePersistActions
          points={points}
          knownLabels={knownLabels}
          mode={mode}
          route={route}
          features={features}
          layers={layers}
          unit={unit}
          durationSeconds={durationSeconds}
          savedRouteName={savedRouteName}
          shareReady={shareReady}
          shareCopied={shareCopied}
          shareError={shareError}
          onRequestSave={onRequestSave}
          onRequestShare={onRequestShare}
        />
      </div>
    </section>
  );
}
