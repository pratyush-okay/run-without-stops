import { elevationParts, formatDistance, type MetricUnit } from "@/lib/routing/format";
import type { RouteScrub } from "@/lib/routing/route-scrub";

const DISTANCE_COLOR = "#c8ff52";
const ELEVATION_COLOR = "#ffb35c";

function DistanceIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-2.5 shrink-0" fill="none" aria-hidden>
      <circle cx="3.3" cy="8" r="1.55" fill={DISTANCE_COLOR} />
      <circle cx="12.7" cy="8" r="1.55" fill={DISTANCE_COLOR} />
      <path d="M5.1 8h5.8" stroke={DISTANCE_COLOR} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ElevationIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-2.5 shrink-0" fill="none" aria-hidden>
      <path
        d="M2.4 12.2 8 4.4l5.6 7.8"
        stroke={ELEVATION_COLOR}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function scrubTipParts(scrub: RouteScrub, unit: MetricUnit) {
  const elevation = elevationParts(scrub.elevationMeters, unit);
  return {
    distance: formatDistance(scrub.distanceMeters, unit),
    elevation: `${elevation.amount} ${elevation.unit}`,
  };
}

export function ScrubTip({
  scrub,
  unit,
  className = "",
}: {
  scrub: RouteScrub;
  unit: MetricUnit;
  className?: string;
}) {
  const parts = scrubTipParts(scrub, unit);
  return (
    <div
      className={`inline-flex items-center gap-2 font-mono text-[10px] whitespace-nowrap text-white ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <DistanceIcon />
        {parts.distance}
      </span>
      <span className="inline-flex items-center gap-1">
        <ElevationIcon />
        {parts.elevation}
      </span>
    </div>
  );
}

export function scrubTipHtml(scrub: RouteScrub, unit: MetricUnit) {
  const parts = scrubTipParts(scrub, unit);
  return `<span class="rws-scrubber-metric"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden="true"><circle cx="3.3" cy="8" r="1.55" fill="${DISTANCE_COLOR}"/><circle cx="12.7" cy="8" r="1.55" fill="${DISTANCE_COLOR}"/><path d="M5.1 8h5.8" stroke="${DISTANCE_COLOR}" stroke-width="1.6" stroke-linecap="round"/></svg>${parts.distance}</span><span class="rws-scrubber-metric"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden="true"><path d="M2.4 12.2 8 4.4l5.6 7.8" stroke="${ELEVATION_COLOR}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${parts.elevation}</span>`;
}
