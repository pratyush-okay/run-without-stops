import type { GeoPoint } from "@/lib/schemas/features";

export function routeDraftKey(points: GeoPoint[], mode: string) {
  return `${mode}:${points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join("|")}`;
}
