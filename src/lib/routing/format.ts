export type MetricUnit = "metric" | "imperial";

export const DEFAULT_PACE_SECONDS_PER_KM = 5 * 60 + 30;
const METERS_PER_KM = 1_000;
const METERS_PER_MILE = 1_609.344;
const MIN_PACE_SECONDS_PER_KM = 2 * 60 + 30;
const MAX_PACE_SECONDS_PER_KM = 12 * 60;

export function formatDistance(meters: number, unit: MetricUnit = "metric") {
  const parts = distanceParts(meters, unit);
  return `${parts.amount} ${parts.unit}`;
}

export function distanceParts(meters: number, unit: MetricUnit = "metric") {
  if (unit === "imperial") {
    const miles = meters / METERS_PER_MILE;
    if (miles < 0.1) return { amount: String(Math.round(meters * 3.28084)), unit: "ft" };
    return { amount: miles.toFixed(miles < 10 ? 2 : 1), unit: "mi" };
  }

  if (meters < 1_000) return { amount: String(Math.round(meters)), unit: "m" };
  const km = meters / METERS_PER_KM;
  return { amount: km.toFixed(km < 10 ? 2 : 1), unit: "km" };
}

export function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

export function formatEffortDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function formatPace(secondsPerUnit: number) {
  const total = Math.max(60, Math.round(secondsPerUnit));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function paceUnitLabel(unit: MetricUnit) {
  return unit === "imperial" ? "/mi" : "/km";
}

export function displayPaceSeconds(secondsPerKm: number, unit: MetricUnit) {
  return unit === "imperial" ? secondsPerKm * (METERS_PER_MILE / METERS_PER_KM) : secondsPerKm;
}

export function storePaceSeconds(displayedSeconds: number, unit: MetricUnit) {
  const secondsPerKm =
    unit === "imperial" ? displayedSeconds / (METERS_PER_MILE / METERS_PER_KM) : displayedSeconds;
  return Math.min(MAX_PACE_SECONDS_PER_KM, Math.max(MIN_PACE_SECONDS_PER_KM, secondsPerKm));
}

export function durationFromPace(meters: number, secondsPerKm: number) {
  return (meters / METERS_PER_KM) * secondsPerKm;
}

export function paceFromDuration(meters: number, durationSeconds: number) {
  if (meters <= 0) return DEFAULT_PACE_SECONDS_PER_KM;
  return storePaceSeconds(durationSeconds / (meters / METERS_PER_KM), "metric");
}
