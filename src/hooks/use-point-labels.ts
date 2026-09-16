"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyticsHeaders } from "@/lib/analytics/client";
import type { GeoPoint } from "@/lib/schemas/features";
import { reverseResponseSchema } from "@/lib/schemas/search";

export function pointLabelKey(point: GeoPoint) {
  return `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
}

export function usePointLabels(points: GeoPoint[], known: Record<string, string> = {}) {
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const knownRef = useRef(known);
  const resolvedRef = useRef(resolved);
  knownRef.current = known;
  resolvedRef.current = resolved;

  useEffect(() => {
    if (points.length === 0) return;
    const controller = new AbortController();

    void Promise.all(
      points.map(async (point) => {
        const key = pointLabelKey(point);
        const existing = knownRef.current[key] ?? resolvedRef.current[key];
        if (existing) return [key, existing] as const;
        const params = new URLSearchParams({
          lat: String(point.lat),
          lng: String(point.lng),
        });
        try {
          const response = await fetch(`/api/reverse?${params}`, {
            signal: controller.signal,
            headers: analyticsHeaders(),
          });
          if (!response.ok) return [key, "Pinned place"] as const;
          const payload = reverseResponseSchema.parse(await response.json());
          return [key, payload.label] as const;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") throw caught;
          return [key, "Pinned place"] as const;
        }
      }),
    )
      .then((entries) => {
        setResolved((current) => ({ ...current, ...Object.fromEntries(entries) }));
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [points]);

  return useMemo(
    () =>
      points.map(
        (point, index) =>
          known[pointLabelKey(point)] ?? resolved[pointLabelKey(point)] ?? `Point ${index + 1}`,
      ),
    [known, points, resolved],
  );
}
