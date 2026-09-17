"use client";

import type { PointerEvent } from "react";
import { ScrubTip } from "@/components/dashboard/scrub-tip";
import { elevationParts, type MetricUnit } from "@/lib/routing/format";
import { type RouteScrub, scrubAtDistance } from "@/lib/routing/route-scrub";
import type { RouteElevation } from "@/lib/schemas/route";

type ChartSize = "compact" | "comfortable" | "expanded";

type ElevationChartProps = {
  elevation: RouteElevation;
  unit: MetricUnit;
  size?: ChartSize;
  coordinates?: [number, number][];
  scrub?: RouteScrub | undefined;
  onScrubChange?: ((scrub: RouteScrub | undefined) => void) | undefined;
};

const CHART_SIZE: Record<
  ChartSize,
  { width: number; height: number; frame: string; svg: string; stroke: number }
> = {
  compact: {
    width: 128,
    height: 28,
    frame: "w-[7.25rem] shrink-0",
    svg: "h-7 w-full",
    stroke: 1.6,
  },
  comfortable: {
    width: 176,
    height: 40,
    frame: "w-[11rem] shrink-0",
    svg: "h-10 w-full",
    stroke: 1.8,
  },
  expanded: { width: 720, height: 84, frame: "w-full", svg: "h-[5.25rem] w-full", stroke: 2 },
};

export function ElevationChart({
  elevation,
  unit,
  size = "compact",
  coordinates = [],
  scrub,
  onScrubChange,
}: ElevationChartProps) {
  const { width, height, frame, svg, stroke } = CHART_SIZE[size];
  const padX = size === "expanded" ? 6 : 2;
  const padY = size === "expanded" ? 6 : 3;
  const samples = elevation.samples;
  const distances = samples.map((sample) => sample.distanceMeters);
  const elevations = samples.map((sample) => sample.elevationMeters);
  const minDistance = distances[0] ?? 0;
  const maxDistance = distances.at(-1) ?? 1;
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const span = Math.max(8, maxElevation - minElevation);
  const length = Math.max(1, maxDistance - minDistance);

  const pointFor = (distanceMeters: number, elevationMeters: number) => {
    const x = padX + ((distanceMeters - minDistance) / length) * (width - padX * 2);
    const y = height - padY - ((elevationMeters - minElevation) / span) * (height - padY * 2);
    return { x, y };
  };

  const plotted = samples.map((sample) => pointFor(sample.distanceMeters, sample.elevationMeters));
  const line = plotted.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;
  const start = elevationParts(minElevation, unit);
  const peak = elevationParts(maxElevation, unit);
  const showCaption = size === "expanded";
  const hover = scrub ? pointFor(scrub.distanceMeters, scrub.elevationMeters) : undefined;
  const traveledDistance = scrub?.distanceMeters;
  const traveled =
    hover && traveledDistance !== undefined
      ? `${padX},${height - padY} ${plotted
          .filter((_, index) => (samples[index]?.distanceMeters ?? 0) <= traveledDistance)
          .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
          .concat(`${hover.x.toFixed(1)},${hover.y.toFixed(1)}`)
          .join(" ")} ${hover.x.toFixed(1)},${height - padY}`
      : "";
  const hoverLeft = hover ? `${Math.min(88, Math.max(12, (hover.x / width) * 100))}%` : "50%";

  const setFromClientX = (event: PointerEvent<SVGSVGElement>) => {
    if (!onScrubChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const x = ratio * width;
    const t = (x - padX) / Math.max(width - padX * 2, 1);
    const distanceMeters = minDistance + Math.min(1, Math.max(0, t)) * length;
    onScrubChange(scrubAtDistance(coordinates, samples, distanceMeters));
  };

  return (
    <figure
      className={`relative ${frame}`}
      aria-label={`Elevation from ${start.amount} ${start.unit} to ${peak.amount} ${peak.unit}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`${svg} ${onScrubChange ? "cursor-crosshair" : ""}`}
        role="img"
        preserveAspectRatio="none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromClientX(event);
        }}
        onPointerMove={setFromClientX}
        onPointerLeave={() => onScrubChange?.(undefined)}
      >
        <title>{`Low ${start.amount} ${start.unit}, high ${peak.amount} ${peak.unit}`}</title>
        <polygon points={area} fill="rgb(200 255 82 / 0.1)" />
        {traveled ? <polygon points={traveled} fill="rgb(200 255 82 / 0.22)" /> : null}
        <polyline
          points={line}
          fill="none"
          stroke="#c8ff52"
          strokeOpacity={hover ? 0.38 : 1}
          strokeWidth={stroke}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hover ? (
          <>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={padY}
              y2={height - padY}
              stroke="rgb(255 255 255 / 0.28)"
              strokeWidth="1"
            />
            <polyline
              points={plotted
                .filter(
                  (_, index) => (samples[index]?.distanceMeters ?? 0) <= (traveledDistance ?? 0),
                )
                .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
                .concat(`${hover.x.toFixed(1)},${hover.y.toFixed(1)}`)
                .join(" ")}
              fill="none"
              stroke="#c8ff52"
              strokeWidth={stroke + 0.3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={hover.x} cy={hover.y} r={size === "compact" ? 2.4 : 3.2} fill="#0a0d0b" />
            <circle cx={hover.x} cy={hover.y} r={size === "compact" ? 1.6 : 2.1} fill="#c8ff52" />
          </>
        ) : null}
      </svg>
      {scrub && size !== "compact" ? (
        <div
          className="pointer-events-none absolute top-0.5 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-[#101512]/92 px-1.5 py-0.5 shadow-[0_8px_20px_rgb(0_0_0_/_0.28)]"
          style={{ left: hoverLeft }}
        >
          <ScrubTip scrub={scrub} unit={unit} />
        </div>
      ) : null}
      {showCaption ? (
        <figcaption className="mt-1.5 flex items-center justify-between text-[11px] text-white/40">
          <span>
            Low {start.amount} {start.unit}
          </span>
          <span>
            High {peak.amount} {peak.unit}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
