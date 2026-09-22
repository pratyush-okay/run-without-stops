"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pointLabelKey } from "@/hooks/use-point-labels";
import { analyticsHeaders, captureEvent } from "@/lib/analytics/client";
import { analyticsEvents } from "@/lib/analytics/events";
import { routeDraftKey } from "@/lib/routes/draft";
import {
  joinReadyPrefix,
  joinRouteLegs,
  legKey,
  matchStoredLegs,
  missingLegIndexes,
  routeGapRequests,
  type StoredLeg,
} from "@/lib/routing/join-route-legs";
import { mapWithConcurrency } from "@/lib/routing/map-pool";
import {
  addRoutePoint,
  closeRouteLoop,
  insertRoutePoint,
  isRouteLoop,
  MAX_ROUTE_STOPS,
  moveRoutePoint,
  removeRoutePoint,
  reverseRoutePoints,
} from "@/lib/routing/points";
import { readRouteCache, routeRequestKey, writeRouteCache } from "@/lib/routing/route-cache";
import type { GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import { type RouteMode, type RouteResponse, routeResponseSchema } from "@/lib/schemas/route";

const QUIET_LEG_FALLBACK =
  "One stretch uses the shortest path because the quieter line could not be calculated.";

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function wait(ms: number, signal: AbortSignal) {
  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function postRoute(
  body: {
    points: GeoPoint[];
    mode: RouteMode;
    avoidElevation: boolean;
    features: RunnerFeature[];
  },
  signal: AbortSignal,
) {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const key = routeRequestKey(body);
  const cached = readRouteCache(key);
  if (cached) return cached;

  const response = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...analyticsHeaders() },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "Route could not be calculated");
  }
  const computed = routeResponseSchema.parse(await response.json());
  writeRouteCache(key, computed);
  return computed;
}

async function postRouteRetry(
  body: {
    points: GeoPoint[];
    mode: RouteMode;
    avoidElevation: boolean;
    features: RunnerFeature[];
  },
  signal: AbortSignal,
) {
  try {
    return await postRoute(body, signal);
  } catch (error) {
    if (isAbort(error) || signal.aborted) throw error;
    await wait(400, signal);
    return postRoute(body, signal);
  }
}

export type RouteSeed = {
  points: GeoPoint[];
  knownLabels?: Record<string, string>;
  mode?: RouteMode;
  route?: RouteResponse;
  avoidElevation?: boolean;
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
  const legsRef = useRef<StoredLeg[]>([]);

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

  const insertPoint = useCallback(
    (gapIndex: number, point: GeoPoint) => {
      resetRedo();
      setPoints((current) => insertRoutePoint(current, gapIndex, point));
    },
    [resetRedo],
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
    legsRef.current = [];
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
        next.route && next.points.length >= 2
          ? routeDraftKey(
              next.points,
              nextMode,
              nextMode === "low_stops" && (next.avoidElevation ?? false),
            )
          : undefined;
      legsRef.current = [];
      resetRedo();
      setPoints(next.points);
      setKnownLabels(next.knownLabels ?? {});
      setMode(nextMode);
      setAvoidElevation(next.avoidElevation ?? false);
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
      legsRef.current = [];
      setRoute(undefined);
      setError(undefined);
      return;
    }

    const mapFeatures = hasSignalData ? featuresRef.current : [];
    const avoid = mode === "low_stops" && avoidElevation;
    const requests = routeGapRequests(points, mode, avoid, mapFeatures);
    const routedFeatures = requests.flatMap((request) => request.features);
    const keys = requests.map(legKey);
    const ready = matchStoredLegs(legsRef.current, keys).map(
      (leg, index) => leg ?? readRouteCache(keys[index] ?? ""),
    );
    const missing = missingLegIndexes(ready);
    if (missing.length === 0) {
      const joined = joinRouteLegs(ready.filter((leg): leg is RouteResponse => Boolean(leg)));
      legsRef.current = keys.flatMap((key, index) => {
        const routeLeg = ready[index];
        return routeLeg ? [{ key, route: routeLeg }] : [];
      });
      writeRouteCache(
        routeRequestKey({ points, mode, avoidElevation: avoid, features: routedFeatures }),
        joined,
      );
      setRoute(joined);
      setError(undefined);
      setIsRouting(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      let finalized = false;
      setIsRouting(true);
      const prefix = joinReadyPrefix(ready);
      if (prefix) {
        setRoute(prefix);
        setError(undefined);
      }

      const directRequests =
        mode === "low_stops" ? routeGapRequests(points, "direct", false, mapFeatures) : [];
      const legs = [...ready];

      const paint = () => {
        if (controller.signal.aborted || finalized) return;
        const preview = legs.every((leg) => leg)
          ? joinRouteLegs(legs.filter((leg): leg is RouteResponse => Boolean(leg)))
          : joinReadyPrefix(legs);
        if (!preview) return;
        setRoute(preview);
        setError(undefined);
      };

      void mapWithConcurrency(missing, 1, async (index) => {
        const request = requests[index];
        if (!request) throw new Error("Route could not be calculated");
        const direct = directRequests[index];

        if (direct && request.mode === "low_stops") {
          try {
            const preview = await postRouteRetry(direct, controller.signal);
            if (!legs[index]) {
              legs[index] = preview;
              paint();
            }
          } catch (error) {
            if (isAbort(error)) throw error;
          }
        }

        try {
          const computed = await postRouteRetry(request, controller.signal);
          legs[index] = computed;
          paint();
          return computed;
        } catch (error) {
          if (isAbort(error) || !direct || request.mode === "direct") throw error;
          const fallback = await postRouteRetry(direct, controller.signal);
          const quiet = {
            ...fallback,
            warnings: [...fallback.warnings, QUIET_LEG_FALLBACK].slice(0, 20),
          };
          legs[index] = quiet;
          paint();
          return quiet;
        }
      })
        .then(() => {
          if (controller.signal.aborted) return;
          if (legs.some((leg) => !leg)) return;
          const complete = legs.filter((leg): leg is RouteResponse => Boolean(leg));
          const joined = joinRouteLegs(complete);
          finalized = true;
          legsRef.current = keys.flatMap((key, index) => {
            const routeLeg = complete[index];
            return routeLeg ? [{ key, route: routeLeg }] : [];
          });
          writeRouteCache(
            routeRequestKey({ points, mode, avoidElevation: avoid, features: routedFeatures }),
            joined,
          );
          setRoute(joined);
          setError(undefined);
          captureEvent(analyticsEvents.routeComputed, {
            mode,
            point_count: points.length,
            provider: joined.provider,
            distance_meters: joined.metrics.distanceMeters,
            traffic_signals: joined.metrics.trafficSignals,
            crossings: joined.metrics.crossings,
          });
        })
        .catch((caught) => {
          if (isAbort(caught) || controller.signal.aborted) return;
          finalized = true;
          setError(caught instanceof Error ? caught.message : "Route could not be calculated");
          captureEvent(analyticsEvents.routeComputeFailed, { mode, point_count: points.length });
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsRouting(false);
        });
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
    insertPoint,
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
