"use client";

import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthControls } from "@/components/auth/auth-controls";
import { type AuthIntent, AuthModal } from "@/components/auth/auth-modal";
import { LayerControls } from "@/components/dashboard/layer-controls";
import { MetricsToggle } from "@/components/dashboard/metrics-toggle";
import { PlaceSearch } from "@/components/dashboard/place-search";
import { RouteComposer } from "@/components/dashboard/route-composer";
import { RouteSummary } from "@/components/dashboard/route-summary";
import { SaveRouteDialog } from "@/components/dashboard/save-route-dialog";
import { SavedRoutesPanel } from "@/components/dashboard/saved-routes-panel";
import { useRoutePlanner } from "@/hooks/use-route-planner";
import { useRunEffort } from "@/hooks/use-run-effort";
import { useRunnerFeatures } from "@/hooks/use-runner-features";
import { useSavedRoutes } from "@/hooks/use-saved-routes";
import type { MapLayerVisibility } from "@/lib/maps/layers";
import { routeDraftKey } from "@/lib/routes/draft";
import { shareUrlForSlug } from "@/lib/routes/slug";
import type { MetricUnit } from "@/lib/routing/format";
import type { GeoPoint } from "@/lib/schemas/features";
import type { SavedRoute } from "@/lib/schemas/saved-route";

const RunningMap = dynamic(
  () => import("@/components/dashboard/running-map").then((mod) => mod.RunningMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#0a0d0b]" /> },
);

type RunningDashboardProps = {
  mapboxToken: string | undefined;
  sharedRoute?: SavedRoute;
};

const INITIAL_LAYERS: MapLayerVisibility = {
  traffic_signal: true,
  crossing: true,
  drinking_water: true,
  parks: true,
  highways: false,
  busy_roads: false,
};

export function RunningDashboard({ mapboxToken, sharedRoute }: RunningDashboardProps) {
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [focusPoint, setFocusPoint] = useState<GeoPoint | undefined>(sharedRoute?.points[0]);
  const [userLocation, setUserLocation] = useState<GeoPoint>();
  const [unit, setUnit] = useState<MetricUnit>("metric");
  const [authIntent, setAuthIntent] = useState<AuthIntent>();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveForShare, setSaveForShare] = useState(false);
  const [suggestedName, setSuggestedName] = useState("Sydney run");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);
  const [currentSaved, setCurrentSaved] = useState<SavedRoute | undefined>(sharedRoute);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareError, setShareError] = useState<string>();
  const pendingAuthRef = useRef<AuthIntent | undefined>(undefined);
  const featureState = useRunnerFeatures();
  const planner = useRoutePlanner(
    featureState.features,
    sharedRoute
      ? {
          points: sharedRoute.points,
          knownLabels: sharedRoute.knownLabels,
          mode: sharedRoute.mode,
          route: sharedRoute.route,
        }
      : undefined,
  );
  const effort = useRunEffort(planner.route?.metrics.distanceMeters);
  const { isSignedIn } = useUser();
  const savedRoutes = useSavedRoutes(Boolean(isSignedIn));

  const currentDraftKey = useMemo(
    () => routeDraftKey(planner.points, planner.mode),
    [planner.mode, planner.points],
  );
  const savedDraftKey = currentSaved
    ? routeDraftKey(currentSaved.points, currentSaved.mode)
    : undefined;
  const activeSaved = savedDraftKey === currentDraftKey ? currentSaved : undefined;

  useEffect(() => {
    if (!isSignedIn) return;
    void fetch("/api/me", { method: "POST" });
    setIsAuthOpen(false);
    const pending = pendingAuthRef.current;
    pendingAuthRef.current = undefined;
    if (pending === "save" || pending === "share") {
      setSaveForShare(pending === "share");
      setSaveError(undefined);
      setShareError(undefined);
      setIsSaveOpen(true);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!sharedRoute) setFocusPoint(point);
        setUserLocation(point);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [sharedRoute]);

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

  function openAuth(intent?: AuthIntent) {
    pendingAuthRef.current = intent;
    setAuthIntent(intent);
    setIsAuthOpen(true);
  }

  function requestSave(name: string) {
    setSuggestedName(name);
    setSaveError(undefined);
    setShareError(undefined);
    if (!isSignedIn) {
      setSaveForShare(false);
      openAuth("save");
      return;
    }
    setSaveForShare(false);
    setIsSaveOpen(true);
  }

  async function copyShareLink(route: SavedRoute) {
    const url = shareUrlForSlug(route.shareSlug, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
      setShareError(undefined);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
      setShareError("Could not copy the share link");
    }
  }

  function requestShare(name: string) {
    setSuggestedName(name);
    setSaveError(undefined);
    setShareError(undefined);
    if (!isSignedIn) {
      setSaveForShare(true);
      openAuth("share");
      return;
    }
    if (activeSaved) {
      void copyShareLink(activeSaved);
      return;
    }
    setSaveForShare(true);
    setIsSaveOpen(true);
  }

  async function saveRoute(name: string) {
    if (!planner.route) return;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      const saved = await savedRoutes.save({
        name,
        points: planner.points,
        knownLabels: planner.knownLabels,
        mode: planner.mode,
        route: planner.route,
      });
      setCurrentSaved(saved);
      setIsSaveOpen(false);
      if (saveForShare) await copyShareLink(saved);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Route could not be saved");
    } finally {
      setIsSaving(false);
    }
  }

  async function loadSaved(id: string) {
    try {
      const saved = await savedRoutes.load(id);
      planner.loadRoute({
        points: saved.points,
        knownLabels: saved.knownLabels,
        mode: saved.mode,
        route: saved.route,
      });
      setCurrentSaved(saved);
      setFocusPoint(saved.points[0]);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Route could not be loaded");
    }
  }

  return (
    <main className="relative h-dvh min-h-dvh overflow-hidden bg-[#0a0d0b] text-white">
      <div className="absolute inset-0">
        <RunningMap
          accessToken={mapboxToken}
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
          <AuthControls
            menuPlacement="down"
            onSignIn={() => openAuth()}
            onOpenSavedRoutes={() => setIsRoutesOpen(true)}
          />
        </div>
      </div>

      {sharedRoute ? (
        <div className="pointer-events-none absolute top-[calc(3.85rem+env(safe-area-inset-top))] left-1/2 z-[6] max-w-[min(22rem,calc(100vw-6rem))] -translate-x-1/2 md:top-[4.6rem]">
          <p className="pointer-events-auto rounded-full border border-white/10 bg-[#101512]/80 px-3 py-1.5 text-center text-[11px] text-white/70 backdrop-blur">
            Shared route · {sharedRoute.name}
          </p>
        </div>
      ) : null}

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
            onClear={() => {
              planner.clear();
              setCurrentSaved(undefined);
            }}
            onRemovePoint={planner.removePoint}
            onReverse={planner.reversePoints}
            onCloseLoop={planner.closeLoop}
            onFocusPoint={setFocusPoint}
            onUseLocation={useMyLocation}
            unit={unit}
            durationSeconds={effort.durationSeconds}
            savedRouteName={activeSaved?.name}
            shareReady={Boolean(activeSaved)}
            shareCopied={shareCopied}
            shareError={shareError}
            onRequestSave={requestSave}
            onRequestShare={requestShare}
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
            <AuthControls
              onSignIn={() => openAuth()}
              onOpenSavedRoutes={() => setIsRoutesOpen(true)}
            />
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
      {!mapboxToken ? (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-[4] max-w-[min(22rem,calc(100vw-5.5rem))] -translate-x-1/2 rounded-full border border-white/10 bg-[#101512]/80 px-3 py-1.5 text-center text-[10px] text-white/70 backdrop-blur md:bottom-28">
          Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to load the dark map
        </div>
      ) : null}

      {isAuthOpen ? (
        <AuthModal
          intent={authIntent}
          onClose={() => {
            pendingAuthRef.current = undefined;
            setIsAuthOpen(false);
          }}
        />
      ) : null}
      {isSaveOpen ? (
        <SaveRouteDialog
          suggestedName={suggestedName}
          title={saveForShare ? "Save to share this route" : "Save this route"}
          description={
            saveForShare
              ? "Shareable links need a saved named route. You can keep the suggested name or write your own."
              : "Keep this line in your account. The name can be yours or based on the places on the route."
          }
          submitLabel={saveForShare ? "Save and copy link" : "Save route"}
          isSaving={isSaving}
          error={saveError}
          onClose={() => setIsSaveOpen(false)}
          onSubmit={(name) => void saveRoute(name)}
        />
      ) : null}
      {isRoutesOpen ? (
        <SavedRoutesPanel
          routes={savedRoutes.routes}
          isLoading={savedRoutes.isLoading}
          error={savedRoutes.error}
          unit={unit}
          onClose={() => setIsRoutesOpen(false)}
          onLoad={(id) => void loadSaved(id)}
          onDelete={(id) => {
            void savedRoutes.remove(id);
            if (currentSaved?.id === id) setCurrentSaved(undefined);
          }}
          onRename={(id, name) => {
            void savedRoutes.rename(id, name).then((saved) => {
              if (currentSaved?.id === id) setCurrentSaved(saved);
            });
          }}
        />
      ) : null}
    </main>
  );
}
