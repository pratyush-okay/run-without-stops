"use client";

import { useCallback, useEffect, useState } from "react";
import { pointLabelKey } from "@/hooks/use-point-labels";
import { distanceMeters } from "@/lib/geo";
import {
  addRoutePoint,
  closeRouteLoop,
  isRouteLoop,
  MAX_ROUTE_STOPS,
  MINIMUM_STOP_SPACING_METERS,
  removeRoutePoint,
  reverseRoutePoints,
} from "@/lib/routing/points";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import { type RouteMode, type RouteResponse, routeResponseSchema } from "@/lib/schemas/route";

export function useRoutePlanner(features: RunnerFeature[]) {
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [knownLabels, setKnownLabels] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<RouteMode>("low_stops");
  const [route, setRoute] = useState<RouteResponse>();
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState<string>();

  const rememberLabel = useCallback((point: GeoPoint, label?: string) => {
    if (!label) return;
    setKnownLabels((current) => ({ ...current, [pointLabelKey(point)]: label }));
  }, []);

  const addPoint = useCallback(
    (point: GeoPoint, label?: string) => {
      rememberLabel(point, label);
      setPoints((current) => addRoutePoint(current, point));
    },
    [rememberLabel],
  );

  const movePoint = useCallback((index: number, point: GeoPoint) => {
    setPoints((current) => {
      const overlapsAnotherPoint = current.some(
        (currentPoint, currentIndex) =>
          currentIndex !== index &&
          distanceMeters(currentPoint, point) < MINIMUM_STOP_SPACING_METERS,
      );
      if (overlapsAnotherPoint) return current;
      return current.map((currentPoint, currentIndex) =>
        currentIndex === index ? point : currentPoint,
      );
    });
  }, []);

  const removePoint = useCallback((index: number) => {
    setPoints((current) => removeRoutePoint(current, index));
  }, []);

  const reversePoints = useCallback(() => {
    setPoints((current) => reverseRoutePoints(current));
  }, []);

  const closeLoop = useCallback(() => {
    setPoints((current) => closeRouteLoop(current));
  }, []);

  const undo = useCallback(() => {
    setPoints((current) => current.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setPoints([]);
    setKnownLabels({});
    setRoute(undefined);
    setError(undefined);
  }, []);

  useEffect(() => {
    if (points.length < 2) {
      setRoute(undefined);
      setError(undefined);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsRouting(true);
      try {
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            points,
            mode,
            features: [
              ...features.filter((feature) => feature.kind === "traffic_signal").slice(0, 60),
              ...features.filter((feature) => feature.kind === "crossing").slice(0, 40),
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Route could not be calculated");
        }
        setRoute(routeResponseSchema.parse(await response.json()));
        setError(undefined);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Route could not be calculated");
      } finally {
        if (!controller.signal.aborted) setIsRouting(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [features, mode, points]);

  return {
    points,
    knownLabels,
    mode,
    route,
    isRouting,
    error,
    canCloseLoop: points.length >= 2 && !isRouteLoop(points) && points.length < MAX_ROUTE_STOPS,
    addPoint,
    movePoint,
    removePoint,
    reversePoints,
    closeLoop,
    undo,
    clear,
    setMode,
  };
}
