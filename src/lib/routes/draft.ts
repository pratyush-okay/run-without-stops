import type { GeoPoint } from "@/lib/schemas/features";

export function routeDraftKey(points: GeoPoint[], mode: string, avoidElevation = false) {
  const hills = avoidElevation ? "flat:" : "";
  return `${mode}:${hills}${points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join("|")}`;
}
