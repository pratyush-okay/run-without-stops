"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { featuresNearRoute } from "@/lib/geo";
import {
  createCrossingIconImage,
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
import { addRoutePoint, moveRoutePoint } from "@/lib/routing/points";
import { linePreviewCoordinates, visibleWaypoints } from "@/lib/routing/waypoints";
import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";

export type { MapLayerVisibility };

type RunningMapProps = {
  accessToken: string | undefined;
  isRoutePreview: boolean;
  points: GeoPoint[];
  routeCoordinates: [number, number][];
  features: RunnerFeature[];
  layers: MapLayerVisibility;
  focusPoint: GeoPoint | undefined;
  userLocation: GeoPoint | undefined;
  onAddPoint: (point: GeoPoint, label?: string) => void;
  onMovePoint: (index: number, point: GeoPoint) => void;
  onRemovePoint: (index: number) => void;
  onBoundsChange: (bounds: BoundingBox) => void;
};

const LABEL_FONT = ["DIN Offc Pro Medium", "Arial Unicode MS Regular"];

function getViewportBounds(map: mapboxgl.Map): BoundingBox | undefined {
  const bounds = map.getBounds();
  if (!bounds) return undefined;
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };
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

function updateWaypointSource(map: mapboxgl.Map, points: GeoPoint[]) {
  geojsonSource(map, "runner-waypoints")?.setData({
    type: "FeatureCollection",
    features: visibleWaypoints(points).map((mark) => ({
      type: "Feature",
      properties: {
        index: mark.index,
        label: mark.label,
        role: mark.role,
        title: mark.title,
      },
      geometry: { type: "Point", coordinates: [mark.point.lng, mark.point.lat] },
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

function updateFeatureSource(
  map: mapboxgl.Map,
  features: RunnerFeature[],
  layers: MapLayerVisibility,
  routeCoordinates: [number, number][],
) {
  const enabled = features.filter((feature) => layers[feature.kind]);
  const visible =
    routeCoordinates.length >= 2
      ? featuresNearRoute(enabled, routePointsFromCoordinates(routeCoordinates))
      : [];
  geojsonSource(map, "runner-features")?.setData({
    type: "FeatureCollection",
    features: visible.map((feature) => ({
      type: "Feature",
      properties: {
        id: feature.id,
        kind: feature.kind,
        name:
          feature.name ??
          (feature.kind === "crossing" ? "Crossing" : feature.kind.replaceAll("_", " ")),
        detail: feature.detail ?? "",
      },
      geometry: {
        type: "Point",
        coordinates: [feature.point.lng, feature.point.lat],
      },
    })),
  });
}

function addOverlayImages(map: mapboxgl.Map) {
  const images = {
    "runner-feature-crossing": createCrossingIconImage(),
    "runner-feature-traffic_signal": createTrafficLightIconImage(),
    "runner-feature-drinking_water": createWaterDropletIconImage(),
  } as const;

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
  map.addLayer(layer, beforeId && map.getLayer(beforeId) ? beforeId : undefined);
}

const WAYPOINT_LAYER_IDS = [
  "runner-waypoints-hit",
  "runner-waypoint-halo",
  "runner-waypoints",
  "runner-waypoint-cores",
  "runner-waypoint-labels",
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

  const overlayBefore = map.getLayer(CONTEXT_OVERLAY_BEFORE) ? CONTEXT_OVERLAY_BEFORE : undefined;
  for (const overlay of contextOverlayLayers()) {
    addLayerOnce(map, overlay, overlayBefore);
  }

  addOverlayImages(map);
  addSourceOnce(map, "runner-waypoints", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-waypoints-hit",
    type: "circle",
    source: "runner-waypoints",
    paint: { "circle-radius": 22, "circle-opacity": 0.01 },
  });
  addLayerOnce(map, waypointHaloLayer(), "runner-waypoints");
  addLayerOnce(map, {
    id: "runner-waypoints",
    type: "circle",
    source: "runner-waypoints",
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
    filter: ["!=", ["get", "role"], "via"],
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
    filter: ["==", ["get", "role"], "via"],
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
}

export function RunningMap({
  accessToken,
  isRoutePreview,
  points,
  routeCoordinates,
  features,
  layers,
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
  const isRoutePreviewRef = useRef(isRoutePreview);
  const featuresRef = useRef(features);
  const layersRef = useRef(layers);
  const userLocationRef = useRef(userLocation);
  const pointerRef = useRef<{ index: number; x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const draggingRef = useRef(false);
  const waypointPopupRef = useRef<mapboxgl.Popup | null>(null);

  addPointRef.current = onAddPoint;
  movePointRef.current = onMovePoint;
  removePointRef.current = onRemovePoint;
  boundsChangeRef.current = onBoundsChange;
  if (!draggingRef.current) {
    pointsRef.current = points;
  }
  routeCoordinatesRef.current = routeCoordinates;
  isRoutePreviewRef.current = isRoutePreview;
  featuresRef.current = features;
  layersRef.current = layers;
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (!containerRef.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;
    const start = userLocationRef.current;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_DARK_STYLE,
      center: start ? [start.lng, start.lat] : [151.2093, -33.8688],
      zoom: start ? 15.2 : 13.8,
      pitch: 0,
      bearing: 0,
      minZoom: 10,
      maxZoom: 20,
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      fadeDuration: 0,
      attributionControl: false,
      antialias: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    const emitBounds = () => {
      if (map.getZoom() < 13) return;
      const bounds = getViewportBounds(map);
      if (bounds) boundsChangeRef.current(bounds);
    };

    const closeWaypointPopup = () => {
      waypointPopupRef.current?.remove();
      waypointPopupRef.current = null;
    };

    const showWaypointPopup = (lngLat: mapboxgl.LngLatLike, index: number, title: string) => {
      closeWaypointPopup();
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
      updateWaypointSource(map, pointsRef.current);
      updateFeatureSource(map, featuresRef.current, layersRef.current, routeCoordinatesRef.current);
      updateUserLocationSource(map, userLocationRef.current);
      emitBounds();
      setMapReady(true);
    });

    map.on("moveend", emitBounds);
    map.on("click", (event: mapboxgl.MapMouseEvent) => {
      const hitLayers = [
        "runner-waypoints-hit",
        "runner-waypoint-halo",
        "runner-waypoints",
        "runner-waypoint-cores",
        "runner-waypoint-labels",
        "runner-features-unclustered",
        "runner-features-halo",
      ].filter((id) => map.getLayer(id));
      const featureHits =
        hitLayers.length > 0 ? map.queryRenderedFeatures(event.point, { layers: hitLayers }) : [];
      if (featureHits.length > 0 || didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      if (waypointPopupRef.current) {
        closeWaypointPopup();
        return;
      }
      const point = { lat: event.lngLat.lat, lng: event.lngLat.lng };
      const nextPoints = addRoutePoint(pointsRef.current, point);
      if (nextPoints !== pointsRef.current) {
        updateWaypointSource(map, nextPoints);
        if (nextPoints.length >= 2) {
          updateRouteSource(map, linePreviewCoordinates(nextPoints), true);
        }
      }
      addPointRef.current(point);
    });

    map.on("click", "runner-features-unclustered", (event: mapboxgl.MapMouseEvent) => {
      const feature = event.features?.[0] as MapFeature | undefined;
      if (feature?.geometry?.type !== "Point") return;
      const wrapper = document.createElement("div");
      wrapper.className = "rws-popup";
      const title = document.createElement("strong");
      title.textContent = String(feature.properties?.name ?? "Map detail");
      wrapper.append(title);
      if (feature.properties?.detail) {
        const detail = document.createElement("span");
        detail.textContent = String(feature.properties.detail);
        wrapper.append(detail);
      }
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      if (String(feature.properties?.kind) === "drinking_water") {
        const point = { lat, lng };
        const nextPoints = addRoutePoint(pointsRef.current, point);
        if (nextPoints !== pointsRef.current) {
          updateWaypointSource(map, nextPoints);
        }
        addPointRef.current(point, String(feature.properties?.name ?? "Drinking water"));
      }
      new mapboxgl.Popup({ offset: 12, closeButton: false, className: "rws-map-popup" })
        .setLngLat([lng, lat])
        .setDOMContent(wrapper)
        .addTo(map);
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
    for (const layerId of [
      "runner-waypoints-hit",
      "runner-waypoint-halo",
      "runner-waypoints",
      "runner-waypoint-cores",
      "runner-waypoint-labels",
    ]) {
      map.on("mousedown", layerId, onWaypointPointerDown);
    }

    const onMouseMove = (event: mapboxgl.MapMouseEvent) => {
      const pointer = pointerRef.current;
      if (!pointer) return;
      const moved = Math.hypot(event.point.x - pointer.x, event.point.y - pointer.y);
      if (!didDragRef.current && moved < 6) return;
      didDragRef.current = true;
      draggingRef.current = true;
      closeWaypointPopup();
      map.getCanvas().style.cursor = "grabbing";
      const point = { lat: event.lngLat.lat, lng: event.lngLat.lng };
      const nextPoints = moveRoutePoint(pointsRef.current, pointer.index, point);
      pointsRef.current = nextPoints;
      updateWaypointSource(map, nextPoints);
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
          updateWaypointSource(map, nextPoints);
          if (nextPoints.length >= 2) {
            updateRouteSource(map, linePreviewCoordinates(nextPoints), true);
          }
          movePointRef.current(pointer.index, point);
        }
        return;
      }
      if (!event) return;
      const hits = map.queryRenderedFeatures(event.point, {
        layers: [
          "runner-waypoints-hit",
          "runner-waypoint-halo",
          "runner-waypoints",
          "runner-waypoint-cores",
          "runner-waypoint-labels",
        ].filter((id) => map.getLayer(id)),
      });
      const feature = hits[0] as MapFeature | undefined;
      const title = String(feature?.properties?.title ?? "Stop");
      showWaypointPopup(event.lngLat, pointer.index, title);
    };
    map.on("mousemove", onMouseMove);
    map.on("mouseup", finishPointer);
    map.getCanvas().addEventListener("mouseleave", () => finishPointer());

    return () => {
      closeWaypointPopup();
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || draggingRef.current) return;
    updateRouteSource(map, routeCoordinates, isRoutePreview);
    updateFeatureSource(map, featuresRef.current, layersRef.current, routeCoordinates);
  }, [isRoutePreview, mapReady, routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || draggingRef.current) return;
    addLayerOnce(map, waypointHaloLayer(), "runner-waypoints");
    showWaypointLayers(map);
    updateWaypointSource(map, points);
  }, [mapReady, points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updateFeatureSource(map, features, layers, routeCoordinatesRef.current);
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
    if (!focusPoint) return;
    mapRef.current?.flyTo({
      center: [focusPoint.lng, focusPoint.lat],
      zoom: 15.2,
      pitch: 0,
      bearing: 0,
      duration: 700,
      essential: true,
    });
  }, [focusPoint]);

  if (!accessToken) {
    return <section className="h-full w-full bg-[#0a0d0b]" aria-label="Sydney running map" />;
  }

  return <section ref={containerRef} className="h-full w-full" aria-label="Sydney running map" />;
}
