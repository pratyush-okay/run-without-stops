"use client";

import { useState } from "react";
import {
  ClearGlyph,
  CopyGlyph,
  ExportGlyph,
  LocationGlyph,
  LoopGlyph,
  ReverseGlyph,
  SaveGlyph,
  ShareGlyph,
  UndoGlyph,
} from "@/components/dashboard/panel-marks";
import { WaypointBadge } from "@/components/dashboard/waypoint-marks";
import { pointLabelKey, usePointLabels } from "@/hooks/use-point-labels";
import { captureEvent } from "@/lib/analytics/client";
import { analyticsEvents } from "@/lib/analytics/events";
import { featuresNearRoute } from "@/lib/geo";
import { suggestedRouteName } from "@/lib/routes/name";
import { fileSafeName } from "@/lib/routes/slug";
import { downloadPngFromSvg, downloadText } from "@/lib/routing/download";
import { formatDistance, formatEffortDuration, type MetricUnit } from "@/lib/routing/format";
import { downloadGpx, routeToGpx } from "@/lib/routing/gpx";
import { routeToSvg, STORY_GRAPHIC_SIZE } from "@/lib/routing/graphic";
import { isRouteLoop, MAX_ROUTE_STOPS } from "@/lib/routing/points";
import { visibleWaypoints } from "@/lib/routing/waypoints";
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
  savedRouteName,
  shareReady = false,
  shareCopied = false,
  shareError,
  onRequestSave,
  onRequestShare,
}: RouteComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const labels = usePointLabels(points, knownLabels);
  const marks = visibleWaypoints(points);
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
        captureEvent(analyticsEvents.routeSummaryCopied, { mode, unit });
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  }

  const exportTitle =
    savedRouteName ??
    suggestedRouteName({
      startLabel: labels[0],
      finishLabel: labels.at(-1),
      isLoop: isRouteLoop(points),
    });
  const exportBase = fileSafeName(exportTitle);
  const exportSubtitle = route
    ? durationSeconds
      ? `${formatDistance(route.metrics.distanceMeters, unit)} · ${formatEffortDuration(durationSeconds)}`
      : formatDistance(route.metrics.distanceMeters, unit)
    : undefined;

  function exportGpx() {
    if (!route) return;
    setExportOpen(false);
    downloadGpx(routeToGpx(route.coordinates, exportTitle), `${exportBase}.gpx`);
    captureEvent(analyticsEvents.routeExported, { format: "gpx", mode });
  }

  function exportSvg() {
    if (!route) return;
    setExportOpen(false);
    downloadText(
      routeToSvg({
        coordinates: route.coordinates,
        name: exportTitle,
        subtitle: exportSubtitle,
      }),
      `${exportBase}.svg`,
      "image/svg+xml",
    );
    captureEvent(analyticsEvents.routeExported, { format: "svg", mode });
  }

  async function exportImage() {
    if (!route) return;
    setExportOpen(false);
    setExportError(undefined);
    try {
      await downloadPngFromSvg(
        routeToSvg({
          coordinates: route.coordinates,
          name: exportTitle,
          subtitle: exportSubtitle,
          background: "#0a0d0b",
        }),
        `${exportBase}.png`,
        STORY_GRAPHIC_SIZE.width,
        STORY_GRAPHIC_SIZE.height,
      );
      captureEvent(analyticsEvents.routeExported, { format: "png", mode });
    } catch {
      setExportError("Image export needs a browser canvas. Try SVG instead.");
    }
  }

  const headline =
    points.length === 0
      ? undefined
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
          {headline ? <p className="mt-1 text-sm text-white/60">{headline}</p> : null}
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
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#c8ff52]/10 text-[13px] font-medium text-[#c8ff52] ring-1 ring-[#c8ff52]/30 transition hover:bg-[#c8ff52]/16"
              onClick={onUseLocation}
            >
              <LocationGlyph />
              Use my location
            </button>
          </div>
        ) : (
          <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 max-h-[min(16.5rem,calc(100dvh-26rem))] md:max-h-[min(20rem,calc(100dvh-24rem))]">
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

        {marks.length > 0 && marks.length < MAX_ROUTE_STOPS ? (
          <p className="mt-2 shrink-0 text-[11px] text-white/35">
            Click the map or search to add a {points.length === 1 ? "finish" : "via"}. Click a pin
            to delete it, or drag to move.
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
          <ReverseGlyph />
          Reverse
        </button>
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onCloseLoop}
          disabled={!canCloseLoop}
          title="Draw the route back to the start pin"
        >
          <LoopGlyph />
          Loop back
        </button>
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onUndo}
          disabled={points.length === 0}
        >
          <UndoGlyph />
          Undo
        </button>
        <button
          type="button"
          className="rws-button min-h-10"
          onClick={onClear}
          disabled={points.length === 0}
        >
          <ClearGlyph />
          Clear
        </button>
      </div>

      {route ? (
        <div className="mt-2 shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="rws-button min-h-10" onClick={copySummary}>
              <CopyGlyph />
              {copied ? "Copied" : "Copy summary"}
            </button>
            <div className="relative">
              <button
                type="button"
                className="rws-button min-h-10 w-full"
                aria-expanded={exportOpen}
                onClick={() => setExportOpen((open) => !open)}
              >
                <ExportGlyph />
                Export
              </button>
              {exportOpen ? (
                <div
                  role="menu"
                  className="rws-panel absolute right-0 bottom-full z-20 mb-1.5 w-full overflow-hidden p-1.5"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="rws-button w-full text-left"
                    onClick={exportGpx}
                  >
                    GPX
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="rws-button w-full text-left"
                    onClick={() => void exportImage()}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="rws-button w-full text-left"
                    onClick={exportSvg}
                  >
                    SVG overlay
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rws-button min-h-10"
              onClick={() => onRequestSave?.(exportTitle)}
            >
              <SaveGlyph />
              {savedRouteName ? "Save again" : "Save route"}
            </button>
            <button
              type="button"
              className="rws-button min-h-10"
              onClick={() => onRequestShare?.(exportTitle)}
            >
              <ShareGlyph />
              {shareCopied ? "Link copied" : shareReady ? "Copy share link" : "Share link"}
            </button>
          </div>
          {savedRouteName ? (
            <p className="text-[10px] text-white/35">Saved as {savedRouteName}</p>
          ) : null}
          {exportError ? <p className="text-[10px] text-[#ffad91]">{exportError}</p> : null}
          {shareError ? <p className="text-[10px] text-[#ffad91]">{shareError}</p> : null}
        </div>
      ) : points.length === 0 ? null : (
        <button
          type="button"
          className="mt-2 flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c8ff52]/10 text-[13px] font-medium text-[#c8ff52] ring-1 ring-[#c8ff52]/30 transition hover:bg-[#c8ff52]/16"
          onClick={onUseLocation}
        >
          <LocationGlyph />
          Use my location
        </button>
      )}
    </section>
  );
}
