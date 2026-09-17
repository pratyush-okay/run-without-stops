"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ClearGlyph,
  CopyGlyph,
  ExportGlyph,
  LoopGlyph,
  RedoGlyph,
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

type RouteShareProps = {
  points: GeoPoint[];
  knownLabels: Record<string, string>;
  mode: RouteMode;
  route: RouteResponse | undefined;
  features: RunnerFeature[];
  unit: MetricUnit;
  durationSeconds: number | undefined;
  savedRouteName?: string | undefined;
  shareReady?: boolean | undefined;
  shareCopied?: boolean | undefined;
  shareError?: string | undefined;
  onRequestSave?: ((suggestedName: string) => void) | undefined;
  onRequestShare?: ((suggestedName: string) => void) | undefined;
};

export type RoutePersistActionsProps = RouteShareProps;

export type RouteEditActionsProps = {
  points: GeoPoint[];
  canCloseLoop: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onReverse: () => void;
  onCloseLoop: () => void;
};

function ActionTile({
  label,
  disabled,
  title,
  expanded,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  title?: string;
  expanded?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex h-full min-h-11 w-full min-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border bg-white/[0.04] px-1.5 py-1.5 text-white/75 transition hover:border-white/16 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 ${
        expanded ? "border-white/20 bg-white/[0.08] text-white" : "border-white/10"
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-expanded={expanded}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      title={title ?? label}
    >
      {children}
      <span className="text-[9px] leading-3 text-white/55">{label}</span>
    </button>
  );
}

export function RouteEditActions({
  points,
  canCloseLoop,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onReverse,
  onCloseLoop,
}: RouteEditActionsProps) {
  return (
    <section className="rws-panel rounded-xl px-1 py-1" aria-label="Action">
      <div className="flex items-stretch gap-1">
        <ActionTile label="Undo" onClick={onUndo} disabled={points.length === 0}>
          <UndoGlyph />
        </ActionTile>
        <ActionTile label="Forward" onClick={onRedo} disabled={!canRedo}>
          <RedoGlyph />
        </ActionTile>
        <ActionTile
          label="Loop back"
          onClick={onCloseLoop}
          disabled={!canCloseLoop}
          title="Draw the route back to the start pin"
        >
          <LoopGlyph />
        </ActionTile>
        <ActionTile label="Reverse" onClick={onReverse} disabled={points.length < 2}>
          <ReverseGlyph />
        </ActionTile>
        <ActionTile label="Clear" onClick={onClear} disabled={points.length === 0}>
          <ClearGlyph />
        </ActionTile>
      </div>
    </section>
  );
}

export function RoutePersistActions({
  points,
  knownLabels,
  mode,
  route,
  features,
  unit,
  durationSeconds,
  savedRouteName,
  shareReady = false,
  shareCopied = false,
  shareError,
  onRequestSave,
  onRequestShare,
}: RoutePersistActionsProps) {
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

  if (!route) return null;

  const copyLabel = copied ? "Copied" : "Copy";
  const saveLabel = savedRouteName ? "Save again" : "Save route";
  const shareLabel = shareCopied ? "Copied" : shareReady ? "Copy link" : "Share link";

  return (
    <div className="mt-3 shrink-0 space-y-2">
      <div ref={exportRef} className="space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <ActionTile
            label={saveLabel}
            onClick={() => {
              setExportOpen(false);
              onRequestSave?.(exportTitle);
            }}
          >
            <SaveGlyph />
          </ActionTile>
          <ActionTile
            label={shareLabel}
            onClick={() => {
              setExportOpen(false);
              onRequestShare?.(exportTitle);
            }}
          >
            <ShareGlyph />
          </ActionTile>
          <ActionTile
            label="Export"
            expanded={exportOpen}
            onClick={() => setExportOpen((open) => !open)}
          >
            <ExportGlyph />
          </ActionTile>
          <ActionTile
            label={copyLabel}
            onClick={() => {
              setExportOpen(false);
              copySummary();
            }}
          >
            <CopyGlyph />
          </ActionTile>
        </div>
        {exportOpen ? (
          <div role="menu" className="grid grid-cols-3 gap-1">
            {(
              [
                ["GPX", exportGpx],
                ["Image", () => void exportImage()],
                ["SVG", exportSvg],
              ] as const
            ).map(([itemLabel, onSelect]) => (
              <button
                key={itemLabel}
                type="button"
                role="menuitem"
                className="flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[11px] text-white/70 transition hover:border-white/16 hover:bg-white/[0.07] hover:text-white"
                onClick={onSelect}
              >
                {itemLabel}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {savedRouteName ? (
        <p className="text-[10px] text-white/35">Saved as {savedRouteName}</p>
      ) : null}
      {exportError ? <p className="text-[10px] text-[#ffad91]">{exportError}</p> : null}
      {shareError ? <p className="text-[10px] text-[#ffad91]">{shareError}</p> : null}
    </div>
  );
}
