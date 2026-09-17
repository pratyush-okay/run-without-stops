"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pointLabelKey } from "@/hooks/use-point-labels";
import { analyticsHeaders, captureEvent } from "@/lib/analytics/client";
import { analyticsEvents } from "@/lib/analytics/events";
import { routeDraftKey } from "@/lib/routes/draft";
import {
  addRoutePoint,
  closeRouteLoop,
  isRouteLoop,
  MAX_ROUTE_STOPS,
  moveRoutePoint,
  removeRoutePoint,
  reverseRoutePoints,
} from "@/lib/routing/points";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import { type RouteMode, type RouteResponse, routeResponseSchema } from "@/lib/schemas/route";

export type RouteSeed = {
  points: GeoPoint[];
  knownLabels?: Record<string, string>;
  mode?: RouteMode;
  route?: RouteResponse;
};

export function useRoutePlanner(features: RunnerFeature[], seed?: RouteSeed) {
  const [points, setPoints] = useState<GeoPoint[]>(seed?.points ?? []);
  const [knownLabels, setKnownLabels] = useState<Record<string, string>>(seed?.knownLabels ?? {});
  const [mode, setMode] = useState<RouteMode>(seed?.mode ?? "low_stops");
  const [avoidElevation, setAvoidElevation] = useState(false);
  const [route, setRoute] = useState<RouteResponse | undefined>(seed?.route);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState<string>();
  const [canRedo, setCanRedo] = useState(false);
  const pointsRef = useRef(points);
  const redoStackRef = useRef<GeoPoint[]>([]);
  pointsRef.current = points;
  const frozenDraftKeyRef = useRef(
    seed?.route && seed.points.length >= 2
      ? routeDraftKey(seed.points, seed.mode ?? "low_stops")
      : undefined,
  );

  const rememberLabel = useCallback((point: GeoPoint, label?: string) => {
    if (!label) return;
    setKnownLabels((current) => ({ ...current, [pointLabelKey(point)]: label }));
  }, []);

  const resetRedo = useCallback(() => {
    redoStackRef.current = [];
    setCanRedo(false);
  }, []);

  const addPoint = useCallback(
    (point: GeoPoint, label?: string) => {
      rememberLabel(point, label);
      resetRedo();
      setPoints((current) => addRoutePoint(current, point));
    },
    [rememberLabel, resetRedo],
  );

  const movePoint = useCallback(
    (index: number, point: GeoPoint) => {
      resetRedo();
      setPoints((current) => moveRoutePoint(current, index, point));
    },
    [resetRedo],
  );

  const removePoint = useCallback(
    (index: number) => {
      resetRedo();
      setPoints((current) => removeRoutePoint(current, index));
    },
    [resetRedo],
  );

  const reversePoints = useCallback(() => {
    resetRedo();
    setPoints((current) => reverseRoutePoints(current));
    captureEvent(analyticsEvents.routeReversed, { point_count: points.length });
  }, [points.length, resetRedo]);

  const closeLoop = useCallback(() => {
    resetRedo();
    setPoints((current) => closeRouteLoop(current));
    captureEvent(analyticsEvents.routeLoopClosed, { point_count: points.length });
  }, [points.length, resetRedo]);

  const undo = useCallback(() => {
    const current = pointsRef.current;
    const last = current.at(-1);
    if (!last) return;
    redoStackRef.current = [...redoStackRef.current, last];
    setCanRedo(true);
    setPoints(current.slice(0, -1));
  }, []);

  const redo = useCallback(() => {
    const next = redoStackRef.current.at(-1);
    if (!next) return;
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setCanRedo(redoStackRef.current.length > 0);
    setPoints((current) => [...current, next]);
    captureEvent(analyticsEvents.routeRedone, { point_count: pointsRef.current.length + 1 });
  }, []);

  const clear = useCallback(() => {
    frozenDraftKeyRef.current = undefined;
    resetRedo();
    setPoints([]);
    setKnownLabels({});
    setAvoidElevation(false);
    setRoute(undefined);
    setError(undefined);
    captureEvent(analyticsEvents.routeCleared);
  }, [resetRedo]);

  const loadRoute = useCallback(
    (next: RouteSeed) => {
      const nextMode = next.mode ?? "low_stops";
      frozenDraftKeyRef.current =
        next.route && next.points.length >= 2 ? routeDraftKey(next.points, nextMode) : undefined;
      resetRedo();
      setPoints(next.points);
      setKnownLabels(next.knownLabels ?? {});
      setMode(nextMode);
      setAvoidElevation(false);
      setRoute(next.route);
      setError(undefined);
    },
    [resetRedo],
  );

  const featuresRef = useRef(features);
  featuresRef.current = features;
  const hasSignalData = features.some(
    (feature) => feature.kind === "traffic_signal" || feature.kind === "crossing",
  );

  useEffect(() => {
    const draftKey = routeDraftKey(points, mode, mode === "low_stops" && avoidElevation);
    if (frozenDraftKeyRef.current && frozenDraftKeyRef.current === draftKey) {
      return;
    }
    frozenDraftKeyRef.current = undefined;

    if (points.length < 2) {
      setRoute(undefined);
      setError(undefined);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsRouting(true);
      try {
        const latestFeatures = hasSignalData ? featuresRef.current : [];
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...analyticsHeaders() },
          body: JSON.stringify({
            points,
            mode,
            avoidElevation: mode === "low_stops" && avoidElevation,
            features: [
              ...latestFeatures.filter((feature) => feature.kind === "traffic_signal").slice(0, 60),
              ...latestFeatures.filter((feature) => feature.kind === "crossing").slice(0, 40),
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Route could not be calculated");
        }
        const computed = routeResponseSchema.parse(await response.json());
        setRoute(computed);
        setError(undefined);
        captureEvent(analyticsEvents.routeComputed, {
          mode,
          point_count: points.length,
          provider: computed.provider,
          distance_meters: computed.metrics.distanceMeters,
          traffic_signals: computed.metrics.trafficSignals,
          crossings: computed.metrics.crossings,
        });
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Route could not be calculated");
        captureEvent(analyticsEvents.routeComputeFailed, { mode, point_count: points.length });
      } finally {
        if (!controller.signal.aborted) setIsRouting(false);
      }
    }, 80);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [avoidElevation, hasSignalData, mode, points]);

  const setRouteMode = useCallback((next: RouteMode) => {
    setMode(next);
    captureEvent(analyticsEvents.routeModeChanged, { mode: next });
  }, []);

  return {
    points,
    knownLabels,
    mode,
    avoidElevation,
    route,
    isRouting,
    error,
    canCloseLoop: points.length >= 2 && !isRouteLoop(points) && points.length <= MAX_ROUTE_STOPS,
    canRedo,
    addPoint,
    movePoint,
    removePoint,
    reversePoints,
    closeLoop,
    undo,
    redo,
    clear,
    loadRoute,
    setMode: setRouteMode,
    setAvoidElevation,
  };
}
