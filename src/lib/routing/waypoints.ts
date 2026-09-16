import { isRouteLoop } from "@/lib/routing/points";
import type { GeoPoint } from "@/lib/schemas/features";

export type WaypointRole = "start" | "finish" | "start_finish" | "via";

export type WaypointMark = {
  index: number;
  point: GeoPoint;
  role: WaypointRole;
  label: string;
  title: string;
};

export function visibleWaypoints(points: GeoPoint[]): WaypointMark[] {
  if (points.length === 0) return [];
  const loop = isRouteLoop(points);
  const lastVisible = loop ? points.length - 2 : points.length - 1;
  const marks: WaypointMark[] = [];

  for (let index = 0; index <= lastVisible; index += 1) {
    const point = points[index];
    if (!point) continue;
    const role: WaypointRole =
      index === 0 && loop
        ? "start_finish"
        : index === 0
          ? "start"
          : index === lastVisible && !loop
            ? "finish"
            : "via";
    marks.push({
      index,
      point,
      role,
      label: role === "via" ? String(index + 1) : "",
      title:
        role === "start_finish"
          ? "Start / finish"
          : role === "start"
            ? "Start"
            : role === "finish"
              ? "Finish"
              : `Stop ${index + 1}`,
    });
  }

  return marks;
}

export function linePreviewCoordinates(points: GeoPoint[]): [number, number][] {
  return points.map((point) => [point.lng, point.lat]);
}
