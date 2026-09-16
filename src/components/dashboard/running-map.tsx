"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { featuresNearRoute } from "@/lib/geo";
import {
  createCrossingIconImage,
  createTrafficLightIconImage,
  createWaterDropletIconImage,
} from "@/lib/maps/feature-icons";
import {
  BUSY_ROAD,
  HIGHWAY_ALERT,
  isBusyRoadBasemapLayer,
  isHighwayBasemapLayer,
  isParkBasemapLayer,
  isQuietLabelLayer,
  isRunnerOverlayLayer,
  MAPBOX_DARK_STYLE,
  type MapLayerVisibility,
  PARK_FILL,
  ROUTE_LIME,
} from "@/lib/maps/layers";
import {
  filterWithoutRoadClasses,
  hiddenRoadClasses,
  transportationLayerAction,
} from "@/lib/maps/road-visibility";
import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";

export type { MapLayerVisibility };

type RunningMapProps = {
  accessToken: string | undefined;
  points: GeoPoint[];
  routeCoordinates: [number, number][];
  features: RunnerFeature[];
  layers: MapLayerVisibility;
  focusPoint: GeoPoint | undefined;
  userLocation: GeoPoint | undefined;
  onAddPoint: (point: GeoPoint, label?: string) => void;
  onMovePoint: (index: number, point: GeoPoint) => void;
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

function updateRouteSource(map: mapboxgl.Map, coordinates: [number, number][]) {
  geojsonSource(map, "runner-route")?.setData(
    coordinates.length >= 2
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        }
      : { type: "FeatureCollection", features: [] },
  );
}

function updateWaypointSource(map: mapboxgl.Map, points: GeoPoint[]) {
  geojsonSource(map, "runner-waypoints")?.setData({
    type: "FeatureCollection",
    features: points.map((point, index) => ({
      type: "Feature",
      properties: { index, label: String(index + 1) },
      geometry: { type: "Point", coordinates: [point.lng, point.lat] },
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

function addFeatureImages(map: mapboxgl.Map) {
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

const originalLineColor = new Map<string, mapboxgl.DataDrivenPropertyValueSpecification<string>>();
const originalFillColor = new Map<string, mapboxgl.DataDrivenPropertyValueSpecification<string>>();
const originalFilter = new Map<string, mapboxgl.FilterSpecification | undefined>();

function rememberPaint(map: mapboxgl.Map, id: string, property: "line-color" | "fill-color") {
  const store = property === "line-color" ? originalLineColor : originalFillColor;
  if (store.has(id)) return;
  try {
    store.set(
      id,
      map.getPaintProperty(id, property) as mapboxgl.DataDrivenPropertyValueSpecification<string>,
    );
  } catch {
    // Layer has no color paint property.
  }
}

function rememberFilter(map: mapboxgl.Map, id: string) {
  if (originalFilter.has(id)) return;
  try {
    originalFilter.set(id, map.getFilter(id) ?? undefined);
  } catch {
    originalFilter.set(id, undefined);
  }
}

function tintLayer(map: mapboxgl.Map, id: string, type: string, color: string, on: boolean) {
  if (type === "line") {
    rememberPaint(map, id, "line-color");
    const restored = originalLineColor.get(id);
    try {
      if (on) map.setPaintProperty(id, "line-color", color);
      else if (restored !== undefined) map.setPaintProperty(id, "line-color", restored);
    } catch {
      // Symbol/case layers without line-color stay as-is.
    }
    return;
  }
  if (type === "fill") {
    rememberPaint(map, id, "fill-color");
    const restored = originalFillColor.get(id);
    try {
      if (on) map.setPaintProperty(id, "fill-color", color);
      else if (restored !== undefined) map.setPaintProperty(id, "fill-color", restored);
    } catch {
      // Outline-only fills stay as-is.
    }
  }
}

function applyBasemap(map: mapboxgl.Map, layers: MapLayerVisibility) {
  if (!map.isStyleLoaded()) return;
  const hiddenRoads = hiddenRoadClasses({
    highways: layers.highways,
    busy_roads: layers.busy_roads,
  });
  const styleLayers = map.getStyle()?.layers ?? [];
  for (const layer of styleLayers) {
    if (isRunnerOverlayLayer(layer.id)) continue;
    if (isQuietLabelLayer(layer.id)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }
    if (isParkBasemapLayer(layer.id)) {
      map.setLayoutProperty(layer.id, "visibility", layers.parks ? "visible" : "none");
      tintLayer(map, layer.id, layer.type, PARK_FILL, layers.parks);
      continue;
    }

    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
    rememberFilter(map, layer.id);
    const action = transportationLayerAction(
      sourceLayer,
      layer.id,
      originalFilter.get(layer.id),
      hiddenRoads,
    );
    if (action === "hide") {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }
    if (action === "filter") {
      map.setLayoutProperty(layer.id, "visibility", "visible");
      const nextFilter = filterWithoutRoadClasses(originalFilter.get(layer.id), hiddenRoads);
      try {
        map.setFilter(layer.id, (nextFilter as mapboxgl.FilterSpecification | undefined) ?? null);
      } catch {
        map.setLayoutProperty(
          layer.id,
          "visibility",
          layers.highways || layers.busy_roads ? "visible" : "none",
        );
      }
    } else {
      const original = originalFilter.get(layer.id);
      try {
        map.setFilter(layer.id, original ?? null);
      } catch {
        // Layers without filters stay as-is.
      }
    }

    if (isHighwayBasemapLayer(layer.id)) {
      tintLayer(map, layer.id, layer.type, HIGHWAY_ALERT, layers.highways);
    } else if (isBusyRoadBasemapLayer(layer.id)) {
      tintLayer(map, layer.id, layer.type, BUSY_ROAD, layers.busy_roads);
    }
  }
}

function addSourceOnce(map: mapboxgl.Map, id: string, source: mapboxgl.SourceSpecification) {
  if (map.getSource(id)) return;
  map.addSource(id, source);
}

function addLayerOnce(map: mapboxgl.Map, layer: mapboxgl.LayerSpecification) {
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer);
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

  addSourceOnce(map, "runner-waypoints", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  addLayerOnce(map, {
    id: "runner-waypoints-hit",
    type: "circle",
    source: "runner-waypoints",
    paint: { "circle-radius": 18, "circle-opacity": 0 },
  });
  addLayerOnce(map, {
    id: "runner-waypoints",
    type: "circle",
    source: "runner-waypoints",
    paint: {
      "circle-radius": 8,
      "circle-color": "#0a0d0b",
      "circle-stroke-color": ROUTE_LIME,
      "circle-stroke-width": 2.4,
    },
  });
  addLayerOnce(map, {
    id: "runner-waypoint-labels",
    type: "symbol",
    source: "runner-waypoints",
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": LABEL_FONT,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#f4f7f5" },
  });

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
  addFeatureImages(map);
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
      "icon-size": 0.9,
      "icon-padding": 0,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
}

export function RunningMap({
  accessToken,
  points,
  routeCoordinates,
  features,
  layers,
  focusPoint,
  userLocation,
  onAddPoint,
  onMovePoint,
  onBoundsChange,
}: RunningMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const addPointRef = useRef(onAddPoint);
  const movePointRef = useRef(onMovePoint);
  const boundsChangeRef = useRef(onBoundsChange);
  const pointsRef = useRef(points);
  const routeCoordinatesRef = useRef(routeCoordinates);
  const featuresRef = useRef(features);
  const layersRef = useRef(layers);
  const userLocationRef = useRef(userLocation);
  const draggedPointRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  addPointRef.current = onAddPoint;
  movePointRef.current = onMovePoint;
  boundsChangeRef.current = onBoundsChange;
  pointsRef.current = points;
  routeCoordinatesRef.current = routeCoordinates;
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

    map.on("style.load", () => {
      addRunnerLayers(map);
      applyBasemap(map, layersRef.current);
      updateRouteSource(map, routeCoordinatesRef.current);
      updateWaypointSource(map, pointsRef.current);
      updateFeatureSource(map, featuresRef.current, layersRef.current, routeCoordinatesRef.current);
      updateUserLocationSource(map, userLocationRef.current);
      emitBounds();
    });

    map.on("moveend", emitBounds);
    map.on("click", (event: mapboxgl.MapMouseEvent) => {
      const hitLayers = ["runner-features-unclustered", "runner-features-halo"].filter((id) =>
        map.getLayer(id),
      );
      const featureHits =
        hitLayers.length > 0 ? map.queryRenderedFeatures(event.point, { layers: hitLayers }) : [];
      if (featureHits.length > 0 || didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      addPointRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
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
        addPointRef.current({ lat, lng }, String(feature.properties?.name ?? "Drinking water"));
      }
      new mapboxgl.Popup({ offset: 12, closeButton: false, className: "rws-map-popup" })
        .setLngLat([lng, lat])
        .setDOMContent(wrapper)
        .addTo(map);
    });

    map.on("mousedown", "runner-waypoints-hit", (event: mapboxgl.MapMouseEvent) => {
      const feature = event.features?.[0] as MapFeature | undefined;
      const index = Number(feature?.properties?.index);
      if (!Number.isInteger(index)) return;
      draggedPointRef.current = index;
      didDragRef.current = true;
      map.dragPan.disable();
      map.getCanvas().style.cursor = "grabbing";
      event.preventDefault();
    });

    const onMouseMove = (event: mapboxgl.MapMouseEvent) => {
      if (draggedPointRef.current === null) return;
      movePointRef.current(draggedPointRef.current, {
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    };
    const finishDrag = () => {
      if (draggedPointRef.current === null) return;
      draggedPointRef.current = null;
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
    };
    map.on("mousemove", onMouseMove);
    map.on("mouseup", finishDrag);
    map.getCanvas().addEventListener("mouseleave", finishDrag);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    updateRouteSource(map, routeCoordinates);
    updateFeatureSource(map, featuresRef.current, layersRef.current, routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    updateWaypointSource(map, points);
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    updateFeatureSource(map, features, layers, routeCoordinatesRef.current);
    applyBasemap(map, layers);
  }, [features, layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    updateUserLocationSource(map, userLocation);
  }, [userLocation]);

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
