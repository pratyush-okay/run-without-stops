"use client";

import { useState } from "react";
import { pointLabelKey, usePointLabels } from "@/hooks/use-point-labels";
import { featuresNearRoute } from "@/lib/geo";
import {
  formatDistance,
  formatEffortDuration,
  formatRouteProvider,
  type MetricUnit,
} from "@/lib/routing/format";
import { downloadGpx, routeToGpx } from "@/lib/routing/gpx";
import { MAX_ROUTE_STOPS } from "@/lib/routing/points";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import type { RouteMode, RouteResponse } from "@/lib/schemas/route";

type RouteComposerProps = {
  points: GeoPoint[];
  knownLabels: Record<string, string>;
  mode: RouteMode;
  route: RouteResponse | undefined;
  error: string | undefined;
  isRouting: boolean;
  features: RunnerFeature[];
  canCloseLoop: boolean;
  onModeChange: (mode: RouteMode) => void;
  onUndo: () => void;
  onClear: () => void;
  onRemovePoint: (index: number) => void;
  onReverse: () => void;
  onCloseLoop: () => void;
  onFocusPoint: (point: GeoPoint) => void;
  onUseLocation: () => void;
  unit: MetricUnit;
  durationSeconds: number | undefined;
};

export function RouteComposer({
  points,
  knownLabels,
  mode,
  route,
  error,
  isRouting,
  features,
  canCloseLoop,
  onModeChange,
  onUndo,
  onClear,
  onRemovePoint,
  onReverse,
  onCloseLoop,
  onFocusPoint,
  onUseLocation,
  unit,
  durationSeconds,
}: RouteComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const labels = usePointLabels(points, knownLabels);
  const routePoints = (route?.coordinates ?? []).map(([lng, lat]) => ({ lng, lat }));
  const nearbyWater =
    routePoints.length >= 2
      ? featuresNearRoute(features, routePoints).filter(
          (feature) => feature.kind === "drinking_water",
        ).length
      : 0;

  function copySummary() {
    if (!route) return;
    const text = [
      durationSeconds
        ? `${formatDistance(route.metrics.distanceMeters, unit)} · ${formatEffortDuration(durationSeconds)}`
        : formatDistance(route.metrics.distanceMeters, unit),
      `${route.metrics.trafficSignals} lights · ${route.metrics.crossings} crossings · ${nearbyWater} water`,
      mode === "low_stops" ? "Low stops" : "Direct",
    ].join(" · ");
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  }

  function exportGpx() {
    if (!route) return;
    downloadGpx(routeToGpx(route.coordinates, "Run Without Stops"));
  }

  const headline =
    points.length === 0
      ? "Tap the map or search a place."
      : points.length === 1
        ? "Start set. Add a finish."
        : isRouting
          ? "Finding your line…"
          : route
            ? `${formatDistance(route.metrics.distanceMeters, unit)} · ${route.metrics.trafficSignals} lights`
            : `${points.length} points`;

  return (
    <section
      className="rws-panel flex max-h-[min(32rem,calc(100dvh-11rem))] w-[min(24rem,calc(100vw-5.25rem))] flex-col overflow-hidden p-3 md:max-h-[min(38rem,calc(100dvh-10rem))] md:w-[min(24rem,calc(100vw-2rem))] md:p-4"
      aria-label="Route builder"
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rws-kicker">Route builder</p>
          <h1 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-white md:text-xl">
            Run without the noise.
          </h1>
          <p className="mt-1 text-sm text-white/60">{headline}</p>
        </div>
        <div className="flex items-center gap-2">
          {isRouting ? (
            <span className="rws-pulse mt-1" role="status" aria-label="Calculating route" />
          ) : null}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-white/55 md:hidden"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="route-builder-details"
          >
            <span className="text-lg leading-none" aria-hidden>
              {expanded ? "–" : "+"}
            </span>
            <span className="sr-only">
              {expanded ? "Hide route details" : "Show route details"}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-black/30 p-1">
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
      <p className="mt-2 shrink-0 text-[11px] leading-4 text-white/40">
        {mode === "low_stops"
          ? "Steers around mapped traffic lights. Not a guarantee."
          : "Takes the most direct pedestrian line."}
      </p>

      <div
        id="route-builder-details"
        className={
          expanded
            ? "mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
            : "mt-3 hidden min-h-0 flex-1 flex-col overflow-hidden md:flex"
        }
      >
        {points.length === 0 ? (
          <div className="shrink-0 rounded-xl border border-dashed border-white/15 px-3 py-3">
            <p className="text-sm leading-5 text-white/55">
              Click the map, search a Sydney place, or start from where you are.
            </p>
            <button
              type="button"
              className="rws-button mt-3 min-h-10 w-full"
              onClick={onUseLocation}
            >
              Use my location
            </button>
          </div>
        ) : (
          <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 max-h-[min(16.5rem,calc(100dvh-26rem))] md:max-h-[min(20rem,calc(100dvh-24rem))]">
            {points.map((point, index) => {
              const role = index === 0 ? "start" : index === points.length - 1 ? "finish" : "via";
              return (
                <li key={`${role}:${pointLabelKey(point)}`}>
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.045] py-1.5 pr-1.5 pl-2.5">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => onFocusPoint(point)}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[#c8ff52]/50 bg-[#c8ff52]/10 font-mono text-[10px] text-[#c8ff52]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white/85">
                          {labels[index] ?? "Pinned place"}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-white/30">
                          {index === 0 ? "Start" : index === points.length - 1 ? "Finish" : "Via"}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-white/35 hover:bg-white/8 hover:text-white"
                      onClick={() => onRemovePoint(index)}
                      aria-label={`Remove ${index === 0 ? "start" : index === points.length - 1 ? "finish" : "via"}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {points.length > 0 && points.length < MAX_ROUTE_STOPS ? (
          <p className="mt-2 shrink-0 text-[11px] text-white/35">
            Click the map or search to add a {points.length === 1 ? "finish" : "via"}. Drag pins to
            reshape.
          </p>
        ) : null}

        {route ? (
          <p className="mt-2 shrink-0 text-[11px] text-white/40">
            {nearbyWater} drinking water near this line.
          </p>
        ) : null}

        {error ? <p className="mt-3 shrink-0 text-sm text-[#ffad91]">{error}</p> : null}
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2">
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onReverse}
          disabled={points.length < 2}
        >
          Reverse
        </button>
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onCloseLoop}
          disabled={!canCloseLoop}
        >
          Loop back
        </button>
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onUndo}
          disabled={points.length === 0}
        >
          Undo
        </button>
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onClear}
          disabled={points.length === 0}
        >
          Clear
        </button>
      </div>

      {route ? (
        <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
          <button type="button" className="rws-button min-h-10" onClick={copySummary}>
            {copied ? "Copied" : "Copy summary"}
          </button>
          <button type="button" className="rws-button min-h-10" onClick={exportGpx}>
            Download GPX
          </button>
        </div>
      ) : points.length === 0 ? null : (
        <button
          type="button"
          className="rws-button mt-2 min-h-10 w-full shrink-0"
          onClick={onUseLocation}
        >
          Use my location
        </button>
      )}

      {route ? (
        <p className="mt-2 shrink-0 text-[10px] text-white/30">
          {formatRouteProvider(route.provider)}
        </p>
      ) : null}
    </section>
  );
}
