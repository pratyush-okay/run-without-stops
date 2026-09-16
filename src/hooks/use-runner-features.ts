"use client";

import { useCallback, useRef, useState } from "react";
import { analyticsHeaders } from "@/lib/analytics/client";
import type { BoundingBox, RunnerFeature } from "@/lib/schemas/features";
import { featuresResponseSchema } from "@/lib/schemas/features";

export function useRunnerFeatures() {
  const [features, setFeatures] = useState<RunnerFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isPartial, setIsPartial] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadForBounds = useCallback((bounds: BoundingBox) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsLoading(true);

      try {
        const params = new URLSearchParams(
          Object.entries(bounds).map(([key, value]) => [key, String(value)]),
        );
        const response = await fetch(`/api/features?${params}`, {
          signal: controller.signal,
          headers: analyticsHeaders(),
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Map details could not be loaded");
        }
        const payload = featuresResponseSchema.parse(await response.json());
        if (!payload.partial || payload.features.length > 0) {
          setFeatures(payload.features);
        }
        setIsPartial(payload.partial);
        setError(undefined);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Map details could not be loaded");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 450);
  }, []);

  return { features, isLoading, error, isPartial, loadForBounds };
}
