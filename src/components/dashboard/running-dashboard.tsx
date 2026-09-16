"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AuthControls } from "@/components/auth/auth-controls";
import { LayerControls } from "@/components/dashboard/layer-controls";
import { MetricsToggle } from "@/components/dashboard/metrics-toggle";
import { PlaceSearch } from "@/components/dashboard/place-search";
import { RouteComposer } from "@/components/dashboard/route-composer";
import { RouteSummary } from "@/components/dashboard/route-summary";
import { type MapLayerVisibility, RunningMap } from "@/components/dashboard/running-map";
import { useRoutePlanner } from "@/hooks/use-route-planner";
import { useRunEffort } from "@/hooks/use-run-effort";
import { useRunnerFeatures } from "@/hooks/use-runner-features";
import type { MetricUnit } from "@/lib/routing/format";
import type { GeoPoint } from "@/lib/schemas/features";

type RunningDashboardProps = {
  mapStyleUrl: string;
};

const INITIAL_LAYERS: MapLayerVisibility = {
  traffic_signal: true,
  crossing: true,
  drinking_water: true,
  parks: true,
  highways: false,
  busy_roads: false,
};

export function RunningDashboard({ mapStyleUrl }: RunningDashboardProps) {
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [focusPoint, setFocusPoint] = useState<GeoPoint>();
  const [userLocation, setUserLocation] = useState<GeoPoint>();
  const [unit, setUnit] = useState<MetricUnit>("metric");
  const featureState = useRunnerFeatures();
  const planner = useRoutePlanner(featureState.features);
  const effort = useRunEffort(planner.route?.metrics.distanceMeters);
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;
    void fetch("/api/me", { method: "POST" });
  }, [isSignedIn]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setFocusPoint(point);
        setUserLocation(point);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  function toggleLayer(layer: keyof MapLayerVisibility) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setFocusPoint(point);
        setUserLocation(point);
        planner.addPoint(point, "My location");
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 },
    );
  }

  return (
    <main className="relative h-dvh min-h-dvh overflow-hidden bg-[#0a0d0b] text-white">
      <div className="absolute inset-0">
        <RunningMap
          mapStyleUrl={mapStyleUrl}
          points={planner.points}
          routeCoordinates={planner.route?.coordinates ?? []}
          features={featureState.features}
          layers={layers}
          focusPoint={focusPoint}
          userLocation={userLocation}
          onAddPoint={planner.addPoint}
          onMovePoint={planner.movePoint}
          onBoundsChange={featureState.loadForBounds}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] md:gap-2.5 md:p-4 md:pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto min-w-0 flex-1">
          <PlaceSearch
            onSelect={(point, label) => {
              setFocusPoint(point);
              planner.addPoint(point, label);
            }}
            onLocate={(point) => {
              setFocusPoint(point);
              setUserLocation(point);
              planner.addPoint(point, "My location");
            }}
          />
        </div>
        <div className="pointer-events-auto shrink-0">
          <MetricsToggle unit={unit} onChange={setUnit} />
        </div>
        <div className="pointer-events-auto shrink-0 md:hidden">
          <AuthControls menuPlacement="down" />
        </div>
      </div>

      <div className="pointer-events-none absolute top-[calc(3.85rem+env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-[5] md:top-[4.6rem] md:left-4">
        <div className="pointer-events-auto">
          <RouteComposer
            points={planner.points}
            knownLabels={planner.knownLabels}
            mode={planner.mode}
            route={planner.route}
            error={planner.error}
            isRouting={planner.isRouting}
            features={featureState.features}
            canCloseLoop={planner.canCloseLoop}
            onModeChange={planner.setMode}
            onUndo={planner.undo}
            onClear={planner.clear}
            onRemovePoint={planner.removePoint}
            onReverse={planner.reversePoints}
            onCloseLoop={planner.closeLoop}
            onFocusPoint={setFocusPoint}
            onUseLocation={useMyLocation}
            unit={unit}
            durationSeconds={effort.durationSeconds}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute top-[calc(3.85rem+env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-[5] md:top-[4.6rem] md:right-4">
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <LayerControls
            layers={layers}
            onToggle={toggleLayer}
            isLoading={featureState.isLoading}
          />
          <div className="hidden md:block">
            <AuthControls />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex justify-center px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto w-full max-w-6xl">
          <RouteSummary
            route={planner.route}
            error={planner.error}
            isRouting={planner.isRouting}
            unit={unit}
            paceSecondsPerKm={effort.secondsPerKm}
            durationSeconds={effort.durationSeconds}
            onNudgePace={(delta) => effort.nudgePace(delta, unit)}
            onNudgeTime={effort.nudgeTime}
          />
        </div>
      </div>

      {featureState.error || featureState.isPartial ? (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-[4] max-w-[min(22rem,calc(100vw-5.5rem))] -translate-x-1/2 rounded-full border border-[#ffad91]/20 bg-[#261712]/90 px-3 py-1.5 text-center text-[10px] text-[#ffad91] backdrop-blur md:bottom-28">
          {featureState.error ?? "Some live OSM details are temporarily unavailable"}
        </div>
      ) : null}
    </main>
  );
}
