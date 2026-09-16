import { shortPlaceLabel } from "@/lib/maps/place-label";

const FALLBACK_NAME = "Sydney run";

function usefulPlace(label: string | undefined) {
  if (!label) return undefined;
  const name = shortPlaceLabel(label);
  if (!name || name === "Pinned place") return undefined;
  return name;
}

export function suggestedRouteName(input: {
  startLabel?: string | undefined;
  finishLabel?: string | undefined;
  isLoop?: boolean | undefined;
}) {
  const start = usefulPlace(input.startLabel);
  const finish = usefulPlace(input.finishLabel);

  if (input.isLoop && start) return `${start} loop`;
  if (start && finish && start === finish) return `${start} loop`;
  if (start && finish) return `${start} to ${finish}`;
  if (start) return `${start} run`;
  if (finish) return `Run to ${finish}`;
  return FALLBACK_NAME;
}
