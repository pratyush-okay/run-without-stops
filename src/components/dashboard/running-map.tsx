"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { scrubTipHtml } from "@/components/dashboard/scrub-tip";
import { featuresNearRoute, WORLD_BOUNDS } from "@/lib/geo";
import {
  type CombinedMark,
  combinedIconId,
  pairWaypointFeatures,
} from "@/lib/maps/combined-markers";
import {
  createClimbIconImage,
  createCombinedMarkIconImage,
  createCrossingIconImage,
  createDescentIconImage,
  createTrafficLightIconImage,
  createWaterDropletIconImage,
} from "@/lib/maps/feature-icons";
import {
  CONTEXT_OVERLAY_BEFORE,
  contextOverlayLayers,
  isQuietLabelLayer,
  isRunnerOverlayLayer,
  MAPBOX_DARK_STYLE,
  type MapLayerVisibility,
  overlayVisibility,
  ROUTE_LIME,
  STOP_CORAL,
} from "@/lib/maps/layers";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FOCUS_MAP_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
} from "@/lib/maps/view";
import type { MetricUnit } from "@/lib/routing/format";
import { addRoutePoint, moveRoutePoint } from "@/lib/routing/points";
import { nearestScrubOnRoute, type RouteScrub, routePrefix } from "@/lib/routing/route-scrub";
import { linePreviewCoordinates, visibleWaypoints } from "@/lib/routing/waypoints";
import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";
import type { ElevationMark, RouteElevation } from "@/lib/schemas/route";

export type { MapLayerVisibility };

type RunningMapProps = {
  accessToken: string | undefined;
  isRoutePreview: boolean;
  points: GeoPoint[];
  routeCoordinates: [number, number][];
  elevationMarks?: ElevationMark[];
  elevationSamples?: RouteElevation["samples"];
  scrub?: RouteScrub | undefined;
  onScrubChange?: ((scrub: RouteScrub | undefined) => void) | undefined;
  unit?: MetricUnit;
  features: RunnerFeature[];
  layers: MapLayerVisibility;
  styleUrl?: string;
  focusPoint: GeoPoint | undefined;
  userLocation: GeoPoint | undefined;
  onAddPoint: (point: GeoPoint, label?: string) => void;
  onMovePoint: (index: number, point: GeoPoint) => void;
  onRemovePoint: (index: number) => void;
  onBoundsChange: (bounds: BoundingBox) => void;
};

const LABEL_FONT = ["DIN Offc Pro Medium", "Arial Unicode MS Regular"];

function getViewportBounds(map: mapboxgl.Map): BoundingBox {
  const bounds = map.getBounds();
  if (!bounds) return WORLD_BOUNDS;
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();
  if (!(south < north) || !(west < east)) return WORLD_BOUNDS;
  return { south, west, north, east };
}

type MapFeature = {
  geometry?: { type: string; coordinates?: unknown };
  properties?: Record<string, unknown> | null;
};

function geojsonSource(map: mapboxgl.Map, id: string) {
  return map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
}

function updateRouteSource(map: mapboxgl.Map, coordinates: [number, number][], dashed = false) {
  geojsonSource(map, "runner-route")?.setData(
    coordinates.length >= 2
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        }
      : { type: "FeatureCollection", features: [] },
  );
  if (!map.getLayer("runner-route")) return;
  map.setPaintProperty("runner-route", "line-dasharray", dashed ? [1.5, 1.4] : [1, 0]);
  map.setPaintProperty("runner-route", "line-opacity", dashed ? 0.72 : 1);
  map.setPaintProperty("runner-route-glow", "line-opacity", dashed ? 0.08 : 0.18);
}

function updateProgressSource(map: mapboxgl.Map, coordinates: [number, number][]) {
  geojsonSource(map, "runner-route-progress")?.setData(
    coordinates.length >= 2
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        }
      : { type: "FeatureCollection", features: [] },
  );
}

function createScrubberElement(html: string) {
  const root = document.createElement("div");
  root.className = "rws-scrubber";
  const tip = document.createElement("div");
  tip.className = "rws-scrubber-tip";
  tip.innerHTML = html;
  const dot = document.createElement("div");
  dot.className = "rws-scrubber-dot";
  root.append(tip, dot);
  return root;
}

function updateElevationSource(map: mapboxgl.Map, marks: ElevationMark[]) {
  geojsonSource(map, "runner-elevation")?.setData({
    type: "FeatureCollection",
    features: marks.map((mark, index) => ({
      type: "Feature",
      properties: {
        kind: mark.kind,
        title: mark.kind === "climb" ? "Climb starts" : "Descent starts",
        detail: `${Math.round(mark.elevationMeters)} m`,
      },
      id: index,
      geometry: { type: "Point", coordinates: [mark.point.lng, mark.point.lat] },
    })),
  });
}

function featureTitle(feature: RunnerFeature) {
  return (
    feature.name ?? (feature.kind === "crossing" ? "Crossing" : feature.kind.replaceAll("_", " "))
  );
}

function combinedMarkTitle(item: CombinedMark) {
  const extras = [item.feature, ...item.extras]
    .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature))
    .map((feature) => featureTitle(feature));
  return extras.length > 0 ? `${item.waypoint.title} · ${extras.join(" · ")}` : item.waypoint.title;
}

function syncOverlayMarkers(
  map: mapboxgl.Map,
  points: GeoPoint[],
  features: RunnerFeature[],
  layers: MapLayerVisibility,
  routeCoordinates: [number, number][],
) {
  const marks = visibleWaypoints(points);
  const enabled = features.filter((feature) => layers[feature.kind]);
  const visible =
    routeCoordinates.length >= 2
      ? featuresNearRoute(enabled, routePointsFromCoordinates(routeCoordinates))
      : [];
  const { combined, leftoverFeatures } = pairWaypointFeatures(marks, visible);
  const pairedIndexes = new Set(combined.map((item) => item.waypoint.index));

  geojsonSource(map, "runner-waypoints")?.setData({
    type: "FeatureCollection",
    features: marks.map((mark) => ({
      type: "Feature",
      properties: {
        index: mark.index,
        label: mark.label,
        role: mark.role,
        title: mark.title,
        paired: pairedIndexes.has(mark.index) ? "yes" : "no",
      },
      geometry: { type: "Point", coordinates: [mark.point.lng, mark.point.lat] },
    })),
  });

  geojsonSource(map, "runner-combined")?.setData({
    type: "FeatureCollection",
    features: combined.map((item) => ({
      type: "Feature",
      properties: {
        index: item.waypoint.index,
        label: item.waypoint.label,
        role: item.waypoint.role,
        kind: item.feature?.kind ?? "",
        title: combinedMarkTitle(item),
      },
      geometry: {
        type: "Point",
        coordinates: [item.waypoint.point.lng, item.waypoint.point.lat],
      },
    })),
  });

  geojsonSource(map, "runner-features")?.setData({
    type: "FeatureCollection",
    features: leftoverFeatures.map((feature) => ({
      type: "Feature",
      properties: {
        id: feature.id,
        kind: feature.kind,
        name: featureTitle(feature),
        detail: feature.detail ?? "",
      },
      geometry: {
        type: "Point",
        coordinates: [feature.point.lng, feature.point.lat],
      },
    })),
  });
}

function updateUserLocationSource(map: mapboxgl.Map, userLocation: GeoPoint | undefined) {
  geojsonSource(map, "user-location")?.setData({
    type: "FeatureCollection",
    features: userLocation
      ? [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] },
          },
        ]
      : [],
  });
}

function routePointsFromCoordinates(coordinates: [number, number][]): GeoPoint[] {
  return coordinates.map(([lng, lat]) => ({ lng, lat }));
}

function addOverlayImages(map: mapboxgl.Map) {
  const images: Record<string, ImageData | undefined> = {
    "runner-feature-crossing": createCrossingIconImage(),
    "runner-feature-traffic_signal": createTrafficLightIconImage(),
    "runner-feature-drinking_water": createWaterDropletIconImage(),
    "runner-elevation-climb": createClimbIconImage(),
    "runner-elevation-descent": createDescentIconImage(),
  };

  images[combinedIconId("start_finish")] = createCombinedMarkIconImage("start_finish");
  for (const role of ["start", "finish", "start_finish", "via"] as const) {
    for (const kind of ["traffic_signal", "crossing"] as const) {
      images[combinedIconId(role, kind)] = createCombinedMarkIconImage(role, kind);
    }
  }

  for (const [imageId, image] of Object.entries(images)) {
    if (!image) continue;
    if (map.hasImage(imageId)) {
      map.updateImage(imageId, image);
      continue;
    }
    map.addImage(imageId, image, { pixelRatio: 2 });
  }
}

function applyBasemap(map: mapboxgl.Map, layers: MapLayerVisibility) {
  if (!map.getSource("composite")) return;

  for (const layer of map.getStyle()?.layers ?? []) {
    if (isRunnerOverlayLayer(layer.id)) continue;
    if (isQuietLabelLayer(layer.id)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }

  const beforeId = map.getLayer(CONTEXT_OVERLAY_BEFORE) ? CONTEXT_OVERLAY_BEFORE : undefined;
  for (const overlay of contextOverlayLayers()) {
    addLayerOnce(map, overlay, beforeId);
    if (!map.getLayer(overlay.id)) continue;
    map.setLayoutProperty(overlay.id, "visibility", overlayVisibility(overlay.id, layers));
  }
}

function addSourceOnce(map: mapboxgl.Map, id: string, source: mapboxgl.SourceSpecification) {
  if (map.getSource(id)) return;
  map.addSource(id, source);
}

function addLayerOnce(map: mapboxgl.Map, layer: mapboxgl.LayerSpecification, beforeId?: string) {
  if (map.getLayer(layer.id)) return;
  if ("source" in layer && layer.source && !map.getSource(layer.source)) return;
  map.addLayer(layer, beforeId && map.getLayer(beforeId) ? beforeId : undefined);
}

const WAYPOINT_LAYER_IDS = [
  "runner-waypoints-hit",
  "runner-waypoint-halo",
  "runner-waypoints",
  "runner-waypoint-cores",
  "runner-waypoint-labels",
  "runner-combined-hit",
  "runner-combined",
] as const;

const WAYPOINT_POINTER_LAYER_IDS = [
  "runner-waypoints-hit",
  "runner-waypoint-halo",
  "runner-waypoints",
  "runner-waypoint-cores",
  "runner-waypoint-labels",
  "runner-combined-hit",
  "runner-combined",
] as const;

function showWaypointLayers(map: mapboxgl.Map) {
  for (const id of WAYPOINT_LAYER_IDS) {
    if (!map.getLayer(id)) continue;
    map.setLayoutProperty(id, "visibility", "visible");
  }
}

function waypointHaloLayer(): mapboxgl.CircleLayerSpecification {
  return {
    id: "runner-waypoint-halo",
    type: "circle",
    source: "runner-waypoints",
    filter: ["!=", ["get", "paired"], "yes"],
    paint: {
      "circle-radius": ["match", ["get", "role"], "start_finish", 15, "via", 11, 14],
      "circle-color": "#070908",
      "circle-opacity": 0.92,
    },
  };
}

function addRunnerLayers(map: mapboxgl.Map) {
  addSourceOnce(map, "runner-route", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-route-glow",
    type: "line",
    source: "runner-route",
    paint: {
      "line-color": ROUTE_LIME,
      "line-width": 18,
      "line-opacity": 0.18,
      "line-blur": 12,
    },
  });
  addLayerOnce(map, {
    id: "runner-route",
    type: "line",
    source: "runner-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ROUTE_LIME,
      "line-width": 5.5,
    },
  });
  addLayerOnce(map, {
    id: "runner-route-hit",
    type: "line",
    source: "runner-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ROUTE_LIME,
      "line-width": 22,
      "line-opacity": 0.01,
    },
  });
  addSourceOnce(map, "runner-route-progress", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-route-progress",
    type: "line",
    source: "runner-route-progress",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#e7ff9a",
      "line-width": 6.2,
      "line-opacity": 1,
    },
  });

  if (map.getSource("composite")) {
    const overlayBefore = map.getLayer(CONTEXT_OVERLAY_BEFORE) ? CONTEXT_OVERLAY_BEFORE : undefined;
    for (const overlay of contextOverlayLayers()) {
      addLayerOnce(map, overlay, overlayBefore);
    }
  }

  addOverlayImages(map);
  addSourceOnce(map, "runner-elevation", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-elevation",
    type: "symbol",
    source: "runner-elevation",
    layout: {
      "icon-image": ["concat", "runner-elevation-", ["get", "kind"]],
      "icon-size": 0.62,
      "icon-padding": 0,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
  addSourceOnce(map, "runner-waypoints", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-waypoints-hit",
    type: "circle",
    source: "runner-waypoints",
    filter: ["!=", ["get", "paired"], "yes"],
    paint: { "circle-radius": 22, "circle-opacity": 0.01 },
  });
  addLayerOnce(map, waypointHaloLayer(), "runner-waypoints");
  addLayerOnce(map, {
    id: "runner-waypoints",
    type: "circle",
    source: "runner-waypoints",
    filter: ["!=", ["get", "paired"], "yes"],
    paint: {
      "circle-radius": ["match", ["get", "role"], "start_finish", 12, "via", 8, 11],
      "circle-color": [
        "match",
        ["get", "role"],
        "start_finish",
        ROUTE_LIME,
        "start",
        ROUTE_LIME,
        "finish",
        STOP_CORAL,
        "#0a0d0b",
      ],
      "circle-stroke-color": [
        "match",
        ["get", "role"],
        "start_finish",
        STOP_CORAL,
        "start",
        "#101512",
        "finish",
        "#fff5f7",
        ROUTE_LIME,
      ],
      "circle-stroke-width": ["match", ["get", "role"], "start_finish", 3.2, "finish", 2.4, 2.2],
    },
  });
  addLayerOnce(map, {
    id: "runner-waypoint-cores",
    type: "circle",
    source: "runner-waypoints",
    filter: ["all", ["!=", ["get", "paired"], "yes"], ["!=", ["get", "role"], "via"]],
    paint: {
      "circle-radius": ["match", ["get", "role"], "finish", 3.6, 3.2],
      "circle-color": [
        "match",
        ["get", "role"],
        "finish",
        "#fff5f7",
        "start_finish",
        STOP_CORAL,
        "#101512",
      ],
      "circle-opacity": 1,
    },
  });
  addLayerOnce(map, {
    id: "runner-waypoint-labels",
    type: "symbol",
    source: "runner-waypoints",
    filter: ["all", ["==", ["get", "role"], "via"], ["!=", ["get", "paired"], "yes"]],
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": LABEL_FONT,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#f4f7f5" },
  });
  if (map.getLayer("runner-waypoint-icons")) {
    map.setLayoutProperty("runner-waypoint-icons", "visibility", "none");
  }
  showWaypointLayers(map);

  addSourceOnce(map, "user-location", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "user-location-halo",
    type: "circle",
    source: "user-location",
    paint: {
      "circle-radius": 22,
      "circle-color": "#7ee8ff",
      "circle-opacity": 0.16,
    },
  });
  addLayerOnce(map, {
    id: "user-location",
    type: "circle",
    source: "user-location",
    paint: {
      "circle-radius": 6.5,
      "circle-color": "#9df0ff",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2.2,
    },
  });

  addSourceOnce(map, "runner-features", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-features-halo",
    type: "circle",
    source: "runner-features",
    paint: { "circle-radius": 14, "circle-opacity": 0 },
  });
  addLayerOnce(map, {
    id: "runner-features-unclustered",
    type: "symbol",
    source: "runner-features",
    layout: {
      "icon-image": ["concat", "runner-feature-", ["get", "kind"]],
      "icon-size": 0.78,
      "icon-padding": 0,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
  addSourceOnce(map, "runner-combined", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-combined-hit",
    type: "circle",
    source: "runner-combined",
    paint: { "circle-radius": 30, "circle-opacity": 0.01 },
  });
  addLayerOnce(map, {
    id: "runner-combined",
    type: "symbol",
    source: "runner-combined",
    layout: {
      "icon-image": [
        "case",
        ["==", ["get", "kind"], ""],
        ["concat", "runner-combined-", ["get", "role"]],
        ["concat", "runner-combined-", ["get", "role"], "-", ["get", "kind"]],
      ],
      "icon-size": 0.92,
      "icon-padding": 0,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": LABEL_FONT,
      "text-offset": [-1.42, 0.04],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#f4f7f5" },
  });
}

export function RunningMap({
  accessToken,
  isRoutePreview,
  points,
  routeCoordinates,
  elevationMarks = [],
  elevationSamples = [],
  scrub,
  onScrubChange,
  unit = "metric",
  features,
  layers,
  styleUrl = MAPBOX_DARK_STYLE,
  focusPoint,
  userLocation,
  onAddPoint,
  onMovePoint,
  onRemovePoint,
  onBoundsChange,
}: RunningMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const addPointRef = useRef(onAddPoint);
  const movePointRef = useRef(onMovePoint);
  const removePointRef = useRef(onRemovePoint);
  const boundsChangeRef = useRef(onBoundsChange);
  const pointsRef = useRef(points);
  const routeCoordinatesRef = useRef(routeCoordinates);
  const elevationMarksRef = useRef(elevationMarks);
  const isRoutePreviewRef = useRef(isRoutePreview);
  const featuresRef = useRef(features);
  const layersRef = useRef(layers);
  const appliedStyleRef = useRef(styleUrl);
  const styleUrlRef = useRef(styleUrl);
  const userLocationRef = useRef(userLocation);
  const pointerRef = useRef<{ index: number; x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const draggingRef = useRef(false);
  const waypointPopupRef = useRef<mapboxgl.Popup | null>(null);
  const featurePopupRef = useRef<mapboxgl.Popup | null>(null);
  const scrubberRef = useRef<mapboxgl.Marker | null>(null);
  const elevationSamplesRef = useRef(elevationSamples);
  const onScrubChangeRef = useRef(onScrubChange);

  addPointRef.current = onAddPoint;
  movePointRef.current = onMovePoint;
  removePointRef.current = onRemovePoint;
  boundsChangeRef.current = onBoundsChange;
  if (!draggingRef.current) {
    pointsRef.current = points;
  }
  routeCoordinatesRef.current = routeCoordinates;
  elevationMarksRef.current = elevationMarks;
  elevationSamplesRef.current = elevationSamples;
  onScrubChangeRef.current = onScrubChange;
  isRoutePreviewRef.current = isRoutePreview;
  featuresRef.current = features;
  layersRef.current = layers;
  styleUrlRef.current = styleUrl;
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (!containerRef.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;
    const start = userLocationRef.current;
    const initialStyleUrl = styleUrlRef.current;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: initialStyleUrl,
      center: start ? [start.lng, start.lat] : [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
      zoom: start ? FOCUS_MAP_ZOOM : DEFAULT_MAP_ZOOM,
      pitch: 0,
      bearing: 0,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: true,
      fadeDuration: 0,
      attributionControl: false,
      antialias: false,
    });
    mapRef.current = map;
    appliedStyleRef.current = initialStyleUrl;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    const emitBounds = () => {
      boundsChangeRef.current(getViewportBounds(map));
    };

    const closeFeaturePopup = () => {
      featurePopupRef.current?.remove();
      featurePopupRef.current = null;
    };

    const closeWaypointPopup = () => {
      waypointPopupRef.current?.remove();
      waypointPopupRef.current = null;
    };

    const closeMapPopups = () => {
      closeWaypointPopup();
      closeFeaturePopup();
    };

    const showWaypointPopup = (lngLat: mapboxgl.LngLatLike, index: number, title: string) => {
      closeMapPopups();
      const wrapper = document.createElement("div");
      wrapper.className = "rws-popup";
      const heading = document.createElement("strong");
      heading.textContent = title;
      const hint = document.createElement("span");
      hint.textContent = "Drag the pin to move it";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rws-popup-delete";
      remove.textContent = "Delete stop";
      remove.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        removePointRef.current(index);
        closeWaypointPopup();
      });
      wrapper.append(heading, hint, remove);
      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
        closeOnClick: false,
        className: "rws-map-popup",
      })
        .setLngLat(lngLat)
        .setDOMContent(wrapper)
        .addTo(map);
      waypointPopupRef.current = popup;
      popup.on("close", () => {
        if (waypointPopupRef.current === popup) waypointPopupRef.current = null;
      });
    };

    map.on("style.load", () => {
      addRunnerLayers(map);
      applyBasemap(map, layersRef.current);
      updateRouteSource(map, routeCoordinatesRef.current, isRoutePreviewRef.current);
      updateElevationSource(map, elevationMarksRef.current);
      syncOverlayMarkers(
        map,
        pointsRef.current,
        featuresRef.current,
        layersRef.current,
        routeCoordinatesRef.current,
      );
      updateUserLocationSource(map, userLocationRef.current);
      emitBounds();
      setMapReady(true);
    });

    map.on("moveend", emitBounds);
    map.on("click", (event: mapboxgl.MapMouseEvent) => {
      const hitLayers = [
        ...WAYPOINT_POINTER_LAYER_IDS,
        "runner-features-unclustered",
        "runner-features-halo",
        "runner-elevation",
      ].filter((id) => map.getLayer(id));
      const featureHits =
        hitLayers.length > 0 ? map.queryRenderedFeatures(event.point, { layers: hitLayers }) : [];
      if (featureHits.length > 0 || didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      if (waypointPopupRef.current || featurePopupRef.current) {
        closeMapPopups();
        return;
      }
      const point = { lat: event.lngLat.lat, lng: event.lngLat.lng };
      const nextPoints = addRoutePoint(pointsRef.current, point);
      if (nextPoints !== pointsRef.current) {
        syncOverlayMarkers(
          map,
          nextPoints,
          featuresRef.current,
          layersRef.current,
          routeCoordinatesRef.current,
        );
        if (nextPoints.length >= 2) {
          updateRouteSource(map, linePreviewCoordinates(nextPoints), true);
        }
      }
      addPointRef.current(point);
    });

    const showFeaturePopup = (lngLat: mapboxgl.LngLatLike, title: string, detail?: string) => {
      closeMapPopups();
      const wrapper = document.createElement("div");
      wrapper.className = "rws-popup";
      const heading = document.createElement("strong");
      heading.textContent = title;
      wrapper.append(heading);
      if (detail) {
        const extra = document.createElement("span");
        extra.textContent = detail;
        wrapper.append(extra);
      }
      const popup = new mapboxgl.Popup({
        offset: 12,
        closeButton: false,
        className: "rws-map-popup",
      })
        .setLngLat(lngLat)
        .setDOMContent(wrapper)
        .addTo(map);
      featurePopupRef.current = popup;
      popup.on("close", () => {
        if (featurePopupRef.current === popup) featurePopupRef.current = null;
      });
    };

    const hitsCombinedMark = (point: mapboxgl.Point) =>
      map.queryRenderedFeatures(point, {
        layers: ["runner-combined", "runner-combined-hit"].filter((id) => map.getLayer(id)),
      }).length > 0;

    map.on("click", "runner-elevation", (event: mapboxgl.MapMouseEvent) => {
      const feature = event.features?.[0] as MapFeature | undefined;
      if (feature?.geometry?.type !== "Point") return;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      showFeaturePopup(
        [lng, lat],
        String(feature.properties?.title ?? "Elevation"),
        String(feature.properties?.detail ?? ""),
      );
    });

    map.on("click", "runner-features-unclustered", (event: mapboxgl.MapMouseEvent) => {
      if (hitsCombinedMark(event.point)) return;
      const feature = event.features?.[0] as MapFeature | undefined;
      if (feature?.geometry?.type !== "Point") return;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      if (String(feature.properties?.kind) === "drinking_water") {
        const point = { lat, lng };
        const nextPoints = addRoutePoint(pointsRef.current, point);
        if (nextPoints !== pointsRef.current) {
          syncOverlayMarkers(
            map,
            nextPoints,
            featuresRef.current,
            layersRef.current,
            routeCoordinatesRef.current,
          );
        }
        addPointRef.current(point, String(feature.properties?.name ?? "Drinking water"));
      }
      showFeaturePopup(
        [lng, lat],
        String(feature.properties?.name ?? "Map detail"),
        feature.properties?.detail ? String(feature.properties.detail) : undefined,
      );
    });

    const onWaypointPointerDown = (event: mapboxgl.MapMouseEvent) => {
      const feature = event.features?.[0] as MapFeature | undefined;
      const index = Number(feature?.properties?.index);
      if (!Number.isInteger(index)) return;
      pointerRef.current = { index, x: event.point.x, y: event.point.y };
      didDragRef.current = false;
      map.dragPan.disable();
      map.getCanvas().style.cursor = "grab";
      event.preventDefault();
    };
    for (const layerId of WAYPOINT_POINTER_LAYER_IDS) {
      map.on("mousedown", layerId, onWaypointPointerDown);
    }

    const onMouseMove = (event: mapboxgl.MapMouseEvent) => {
      const pointer = pointerRef.current;
      if (!pointer) return;
      const moved = Math.hypot(event.point.x - pointer.x, event.point.y - pointer.y);
      if (!didDragRef.current && moved < 6) return;
      didDragRef.current = true;
      draggingRef.current = true;
      closeMapPopups();
      map.getCanvas().style.cursor = "grabbing";
      const point = { lat: event.lngLat.lat, lng: event.lngLat.lng };
      const nextPoints = moveRoutePoint(pointsRef.current, pointer.index, point);
      pointsRef.current = nextPoints;
      syncOverlayMarkers(
        map,
        nextPoints,
        featuresRef.current,
        layersRef.current,
        routeCoordinatesRef.current,
      );
      if (nextPoints.length >= 2) {
        updateRouteSource(map, linePreviewCoordinates(nextPoints), true);
      }
    };
    const finishPointer = (event?: mapboxgl.MapMouseEvent) => {
      const pointer = pointerRef.current;
      if (!pointer) return;
      pointerRef.current = null;
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
      if (didDragRef.current) {
        draggingRef.current = false;
        const point = event
          ? { lat: event.lngLat.lat, lng: event.lngLat.lng }
          : pointsRef.current[pointer.index];
        if (point) {
          const nextPoints = moveRoutePoint(pointsRef.current, pointer.index, point);
          pointsRef.current = nextPoints;
          syncOverlayMarkers(
            map,
            nextPoints,
            featuresRef.current,
            layersRef.current,
            routeCoordinatesRef.current,
          );
          if (nextPoints.length >= 2) {
            updateRouteSource(map, linePreviewCoordinates(nextPoints), true);
          }
          movePointRef.current(pointer.index, point);
        }
        return;
      }
      if (!event) return;
      const hits = map.queryRenderedFeatures(event.point, {
        layers: WAYPOINT_POINTER_LAYER_IDS.filter((id) => map.getLayer(id)),
      });
      const feature = hits[0] as MapFeature | undefined;
      const title = String(feature?.properties?.title ?? "Stop");
      showWaypointPopup(event.lngLat, pointer.index, title);
    };
    map.on("mousemove", onMouseMove);
    map.on("mouseup", finishPointer);
    map.getCanvas().addEventListener("mouseleave", () => finishPointer());

    return () => {
      closeMapPopups();
      scrubberRef.current?.remove();
      scrubberRef.current = null;
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedStyleRef.current === styleUrl) return;
    appliedStyleRef.current = styleUrl;
    setMapReady(false);
    map.setStyle(styleUrl);
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || draggingRef.current) return;
    updateRouteSource(map, routeCoordinates, isRoutePreview);
    updateElevationSource(map, isRoutePreview ? [] : elevationMarks);
    syncOverlayMarkers(
      map,
      pointsRef.current,
      featuresRef.current,
      layersRef.current,
      routeCoordinates,
    );
  }, [elevationMarks, isRoutePreview, mapReady, routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const onRouteMove = (event: mapboxgl.MapMouseEvent) => {
      if (
        pointerRef.current ||
        isRoutePreviewRef.current ||
        elevationSamplesRef.current.length < 2
      ) {
        return;
      }
      const hoverLayers = ["runner-route-hit", "runner-route", "runner-route-progress"].filter(
        (id) => map.getLayer(id),
      );
      const hits =
        hoverLayers.length > 0
          ? map.queryRenderedFeatures(event.point, { layers: hoverLayers })
          : [];
      if (hits.length === 0) {
        onScrubChangeRef.current?.(undefined);
        map.getCanvas().style.cursor = "";
        return;
      }
      const next = nearestScrubOnRoute(routeCoordinatesRef.current, elevationSamplesRef.current, {
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
      if (!next) {
        onScrubChangeRef.current?.(undefined);
        map.getCanvas().style.cursor = "";
        return;
      }
      map.getCanvas().style.cursor = "crosshair";
      onScrubChangeRef.current?.(next);
    };

    map.on("mousemove", onRouteMove);
    return () => {
      map.off("mousemove", onRouteMove);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (!scrub || isRoutePreview) {
      updateProgressSource(map, []);
      if (map.getLayer("runner-route") && !isRoutePreview) {
        map.setPaintProperty("runner-route", "line-opacity", 1);
      }
      scrubberRef.current?.remove();
      scrubberRef.current = null;
      return;
    }

    updateProgressSource(map, routePrefix(routeCoordinates, scrub.distanceMeters));
    if (map.getLayer("runner-route")) {
      map.setPaintProperty("runner-route", "line-opacity", 0.4);
    }

    const tipHtml = scrubTipHtml(scrub, unit);
    if (!scrubberRef.current) {
      scrubberRef.current = new mapboxgl.Marker({
        element: createScrubberElement(tipHtml),
        anchor: "bottom",
        offset: [0, 8],
      })
        .setLngLat([scrub.point.lng, scrub.point.lat])
        .addTo(map);
      return;
    }

    scrubberRef.current.setLngLat([scrub.point.lng, scrub.point.lat]);
    const tip = scrubberRef.current.getElement().querySelector(".rws-scrubber-tip");
    if (tip) tip.innerHTML = tipHtml;
  }, [isRoutePreview, mapReady, routeCoordinates, scrub, unit]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || draggingRef.current) return;
    addLayerOnce(map, waypointHaloLayer(), "runner-waypoints");
    showWaypointLayers(map);
    syncOverlayMarkers(
      map,
      points,
      featuresRef.current,
      layersRef.current,
      routeCoordinatesRef.current,
    );
  }, [mapReady, points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    syncOverlayMarkers(map, pointsRef.current, features, layers, routeCoordinatesRef.current);
  }, [features, layers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    applyBasemap(map, layers);
  }, [layers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updateUserLocationSource(map, userLocation);
  }, [mapReady, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!focusPoint || !map) return;
    map.flyTo({
      center: [focusPoint.lng, focusPoint.lat],
      zoom: Math.max(map.getZoom(), FOCUS_MAP_ZOOM),
      pitch: 0,
      bearing: 0,
      duration: 700,
      essential: true,
    });
  }, [focusPoint]);

  if (!accessToken) {
    return <section className="h-full w-full bg-[#0a0d0b]" aria-label="Running map" />;
  }

  return <section ref={containerRef} className="h-full w-full" aria-label="Running map" />;
}
