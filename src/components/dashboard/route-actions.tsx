"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
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
import { usePointLabels } from "@/hooks/use-point-labels";
import { captureEvent } from "@/lib/analytics/client";
import { analyticsEvents } from "@/lib/analytics/events";
import { featuresNearRoute } from "@/lib/geo";
import { suggestedRouteName } from "@/lib/routes/name";
import { fileSafeName } from "@/lib/routes/slug";
import { downloadPngFromSvg, downloadText } from "@/lib/routing/download";
import {
  formatDistance,
  formatEffortDuration,
  formatElevation,
  type MetricUnit,
} from "@/lib/routing/format";
import { downloadGpx, routeToGpx } from "@/lib/routing/gpx";
import { routeToSvg, STORY_GRAPHIC_SIZE } from "@/lib/routing/graphic";
import { isRouteLoop } from "@/lib/routing/points";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import type { RouteMode, RouteResponse } from "@/lib/schemas/route";

export type RouteActionsProps = {
  variant: "panel" | "bar";
  points: GeoPoint[];
  knownLabels: Record<string, string>;
  mode: RouteMode;
  route: RouteResponse | undefined;
  features: RunnerFeature[];
  canCloseLoop: boolean;
  onUndo: () => void;
  onClear: () => void;
  onReverse: () => void;
  onCloseLoop: () => void;
  onUseLocation: () => void;
  unit: MetricUnit;
  durationSeconds: number | undefined;
  savedRouteName?: string | undefined;
  shareReady?: boolean | undefined;
  shareCopied?: boolean | undefined;
  shareError?: string | undefined;
  onRequestSave?: ((suggestedName: string) => void) | undefined;
  onRequestShare?: ((suggestedName: string) => void) | undefined;
};

function ToolButton({
  compact,
  label,
  disabled,
  title,
  expanded,
  onClick,
  children,
}: {
  compact: boolean;
  label: string;
  disabled?: boolean;
  title?: string;
  expanded?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  if (compact) {
    return (
      <button
        type="button"
        className="grid h-8 min-w-8 flex-1 place-items-center rounded-md text-white/70 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-30"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-expanded={expanded}
        title={title ?? label}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="rws-button min-h-10"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
      {label}
    </button>
  );
}

export function RouteActions({
  variant,
  points,
  knownLabels,
  mode,
  route,
  features,
  canCloseLoop,
  onUndo,
  onClear,
  onReverse,
  onCloseLoop,
  onUseLocation,
  unit,
  durationSeconds,
  savedRouteName,
  shareReady = false,
  shareCopied = false,
  shareError,
  onRequestSave,
  onRequestShare,
}: RouteActionsProps) {
  const compact = variant === "bar";
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const exportRef = useRef<HTMLDivElement>(null);
  const labels = usePointLabels(points, knownLabels);
  const routePoints = (route?.coordinates ?? []).map(([lng, lat]) => ({ lng, lat }));
  const nearbyWater =
    routePoints.length >= 2
      ? featuresNearRoute(features, routePoints).filter(
          (feature) => feature.kind === "drinking_water",
        ).length
      : 0;

  useEffect(() => {
    if (!exportOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (exportRef.current?.contains(event.target as Node)) return;
      setExportOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExportOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [exportOpen]);

  function copySummary() {
    if (!route) return;
    const text = [
      durationSeconds
        ? `${formatDistance(route.metrics.distanceMeters, unit)} · ${formatEffortDuration(durationSeconds)}`
        : formatDistance(route.metrics.distanceMeters, unit),
      `${route.metrics.trafficSignals} lights · ${route.metrics.crossings} crossings · ${nearbyWater} water`,
      route.metrics.ascentMeters === undefined
        ? undefined
        : `${formatElevation(route.metrics.ascentMeters, unit)} gain`,
      mode === "low_stops" ? "Low stops" : "Direct",
    ]
      .filter(Boolean)
      .join(" · ");
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

  const copyLabel = copied ? "Copied" : "Copy";
  const saveLabel = savedRouteName ? "Save again" : "Save route";
  const shareLabel = shareCopied ? "Link copied" : shareReady ? "Copy share link" : "Share link";

  const editTools = (
    <>
      <ToolButton
        compact={compact}
        label="Reverse"
        onClick={onReverse}
        disabled={points.length < 2}
      >
        <ReverseGlyph />
      </ToolButton>
      <ToolButton
        compact={compact}
        label="Loop back"
        onClick={onCloseLoop}
        disabled={!canCloseLoop}
        title="Draw the route back to the start pin"
      >
        <LoopGlyph />
      </ToolButton>
      <ToolButton compact={compact} label="Undo" onClick={onUndo} disabled={points.length === 0}>
        <UndoGlyph />
      </ToolButton>
      <ToolButton compact={compact} label="Clear" onClick={onClear} disabled={points.length === 0}>
        <ClearGlyph />
      </ToolButton>
    </>
  );

  const exportMenu = (
    <div
      role="menu"
      className={`rws-panel absolute z-20 overflow-hidden p-1.5 ${
        compact ? "right-0 bottom-full mb-1.5 w-36" : "right-0 bottom-full mb-1.5 w-full"
      }`}
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
  );

  if (compact) {
    return (
      <section className="rws-panel rounded-xl px-0.5 py-0.5" aria-label="Route tools">
        <div className="flex items-center gap-px">
          {editTools}
          {route ? (
            <>
              <ToolButton compact label={copyLabel} onClick={copySummary}>
                <CopyGlyph />
              </ToolButton>
              <div ref={exportRef} className="relative flex min-w-8 flex-1 justify-center">
                <ToolButton
                  compact
                  label="Export"
                  expanded={exportOpen}
                  onClick={() => setExportOpen((open) => !open)}
                >
                  <ExportGlyph />
                </ToolButton>
                {exportOpen ? exportMenu : null}
              </div>
              <ToolButton compact label={saveLabel} onClick={() => onRequestSave?.(exportTitle)}>
                <SaveGlyph />
              </ToolButton>
              <ToolButton compact label={shareLabel} onClick={() => onRequestShare?.(exportTitle)}>
                <ShareGlyph />
              </ToolButton>
            </>
          ) : (
            <ToolButton compact label="Use my location" onClick={onUseLocation}>
              <LocationGlyph />
            </ToolButton>
          )}
        </div>
        {exportError ? <p className="px-2 pt-1 text-[10px] text-[#ffad91]">{exportError}</p> : null}
        {shareError ? <p className="px-2 pt-1 text-[10px] text-[#ffad91]">{shareError}</p> : null}
      </section>
    );
  }

  return (
    <>
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2">{editTools}</div>

      {route ? (
        <div className="mt-2 shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <ToolButton compact={false} label={copyLabel} onClick={copySummary}>
              <CopyGlyph />
            </ToolButton>
            <div ref={exportRef} className="relative">
              <button
                type="button"
                className="rws-button min-h-10 w-full"
                aria-expanded={exportOpen}
                onClick={() => setExportOpen((open) => !open)}
              >
                <ExportGlyph />
                Export
              </button>
              {exportOpen ? exportMenu : null}
            </div>
            <ToolButton
              compact={false}
              label={saveLabel}
              onClick={() => onRequestSave?.(exportTitle)}
            >
              <SaveGlyph />
            </ToolButton>
            <ToolButton
              compact={false}
              label={shareLabel}
              onClick={() => onRequestShare?.(exportTitle)}
            >
              <ShareGlyph />
            </ToolButton>
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
    </>
  );
}
