"use client";

import type {
  GeoJSONSource,
  MapGeoJSONFeature,
  Map as MapLibreMap,
  MapMouseEvent,
  StyleSpecification,
} from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { featuresNearRoute } from "@/lib/geo";
import { liftMutedColor } from "@/lib/maps/color";
import {
  createCrossingIconImage,
  createTrafficLightIconImage,
  createWaterDropletIconImage,
} from "@/lib/maps/feature-icons";
import {
  filterWithoutRoadClasses,
  hiddenRoadClasses,
  transportationLayerAction,
} from "@/lib/maps/road-visibility";
import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";

export type MapLayerVisibility = {
  traffic_signal: boolean;
  crossing: boolean;
  drinking_water: boolean;
  parks: boolean;
  highways: boolean;
  busy_roads: boolean;
};

type RunningMapProps = {
  mapStyleUrl: string;
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

const PARK_PATTERN = /(park|grass|wood|forest|green)/i;

const OSM_DEMO_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-demo", type: "raster", source: "osm" }],
};

function resolveMapStyle(mapStyleUrl: string): string | StyleSpecification {
  if (mapStyleUrl === "osm-demo") return OSM_DEMO_STYLE;
  if (!mapStyleUrl.includes("{z}")) return mapStyleUrl;

  return {
    version: 8,
    sources: {
      stadia: {
        type: "raster",
        tiles: [mapStyleUrl],
        tileSize: 256,
        maxzoom: 20,
        attribution: "© Stadia Maps © OpenMapTiles © OpenStreetMap contributors",
      },
    },
    layers: [{ id: "stadia-basemap", type: "raster", source: "stadia" }],
  };
}

function getViewportBounds(map: MapLibreMap): BoundingBox {
  const bounds = map.getBounds();
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };
}

function updateRouteSource(map: MapLibreMap, coordinates: [number, number][]) {
  const source = map.getSource("runner-route") as GeoJSONSource | undefined;
  source?.setData(
    coordinates.length >= 2
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        }
      : { type: "FeatureCollection", features: [] },
  );
}

function updateWaypointSource(map: MapLibreMap, points: GeoPoint[]) {
  const source = map.getSource("runner-waypoints") as GeoJSONSource | undefined;
  source?.setData({
    type: "FeatureCollection",
    features: points.map((point, index) => ({
      type: "Feature",
      properties: { index, label: String(index + 1) },
      geometry: { type: "Point", coordinates: [point.lng, point.lat] },
    })),
  });
}

function updateUserLocationSource(map: MapLibreMap, userLocation: GeoPoint | undefined) {
  const source = map.getSource("user-location") as GeoJSONSource | undefined;
  source?.setData({
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
  map: MapLibreMap,
  features: RunnerFeature[],
  layers: MapLayerVisibility,
  routeCoordinates: [number, number][],
) {
  const source = map.getSource("runner-features") as GeoJSONSource | undefined;
  const enabled = features.filter((feature) => layers[feature.kind]);
  const visible =
    routeCoordinates.length >= 2
      ? featuresNearRoute(enabled, routePointsFromCoordinates(routeCoordinates))
      : [];
  source?.setData({
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

function addFeatureImages(map: MapLibreMap) {
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

function addRoadHighlightLayers(map: MapLibreMap) {
  if (!map.getSource("openmaptiles")) return;

  map.addLayer({
    id: "runner-busy-roads",
    type: "line",
    source: "openmaptiles",
    "source-layer": "transportation",
    filter: ["in", ["get", "class"], ["literal", ["primary", "secondary"]]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#f6c453",
      "line-opacity": 0.4,
      "line-blur": 0.8,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 15, 3.2, 19, 7],
    },
  });
  map.addLayer({
    id: "runner-highways",
    type: "line",
    source: "openmaptiles",
    "source-layer": "transportation",
    filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#ff7043",
      "line-opacity": 0.42,
      "line-blur": 1,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.6, 15, 4.2, 19, 8.5],
    },
  });
}

const originalRoadFilters = new Map<string, unknown>();
const originalRoadVisibility = new Map<string, "visible" | "none">();

function styleBaseMap(map: MapLibreMap, layers: MapLayerVisibility) {
  const style = map.getStyle() as StyleSpecification | undefined;
  if (!style) return;

  for (const layer of style.layers ?? []) {
    const isPark = PARK_PATTERN.test(layer.id);

    if (isPark) {
      map.setLayoutProperty(layer.id, "visibility", layers.parks ? "visible" : "none");
      if (layer.type === "fill") {
        map.setPaintProperty(layer.id, "fill-color", "#2f6a3c");
        map.setPaintProperty(layer.id, "fill-opacity", 0.92);
      }
    }
  }

  const hidden = hiddenRoadClasses(layers);
  for (const layer of style.layers ?? []) {
    if (layer.id.startsWith("runner-")) continue;
    if (layer.type !== "line" && layer.type !== "symbol" && layer.type !== "fill") continue;
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
    const rememberedFilter = originalRoadFilters.has(layer.id)
      ? originalRoadFilters.get(layer.id)
      : layer.filter;
    const probe = transportationLayerAction(
      sourceLayer,
      layer.id,
      rememberedFilter,
      hiddenRoadClasses({ highways: false, busy_roads: false }),
    );
    if (probe === "keep") continue;

    if (!originalRoadFilters.has(layer.id)) {
      originalRoadFilters.set(layer.id, layer.filter);
      const currentVisibility = map.getLayoutProperty(layer.id, "visibility");
      originalRoadVisibility.set(layer.id, currentVisibility === "none" ? "none" : "visible");
    }

    const action = transportationLayerAction(sourceLayer, layer.id, rememberedFilter, hidden);
    if (action === "hide") {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }

    map.setLayoutProperty(
      layer.id,
      "visibility",
      originalRoadVisibility.get(layer.id) ?? "visible",
    );
    const nextFilter =
      action === "filter"
        ? filterWithoutRoadClasses(rememberedFilter, hidden)
        : (rememberedFilter ?? null);
    try {
      map.setFilter(layer.id, (nextFilter ?? null) as never);
    } catch {
      // Leave the original style filter if a layer cannot accept the rewritten one.
    }
  }

  if (map.getLayer("runner-highways")) {
    map.setLayoutProperty("runner-highways", "visibility", layers.highways ? "visible" : "none");
  }
  if (map.getLayer("runner-busy-roads")) {
    map.setLayoutProperty(
      "runner-busy-roads",
      "visibility",
      layers.busy_roads ? "visible" : "none",
    );
  }

  sharpenBaseMap(map);
}

function setPaintSafe(
  map: MapLibreMap,
  layerId: string,
  property: Parameters<MapLibreMap["setPaintProperty"]>[1],
  value: unknown,
) {
  try {
    map.setPaintProperty(layerId, property, value as never);
  } catch {
    // Some style layers reject paint overrides.
  }
}

function sharpenBaseMap(map: MapLibreMap) {
  const style = map.getStyle() as StyleSpecification | undefined;
  if (!style) return;

  for (const layer of style.layers ?? []) {
    if (layer.id.startsWith("runner-")) continue;

    if (layer.type === "symbol") {
      setPaintSafe(map, layer.id, "text-opacity", 1);
      setPaintSafe(map, layer.id, "icon-opacity", 1);
      const haloWidth = map.getPaintProperty(layer.id, "text-halo-width");
      if (typeof haloWidth !== "object" || haloWidth == null) {
        setPaintSafe(map, layer.id, "text-halo-width", Math.max(Number(haloWidth) || 0, 1.25));
      }
      setPaintSafe(map, layer.id, "text-halo-color", "rgba(6, 10, 8, 0.94)");
      const textColor = map.getPaintProperty(layer.id, "text-color");
      if (typeof textColor === "string") {
        setPaintSafe(map, layer.id, "text-color", "#eef3ef");
      }
    }

    if (layer.type === "line") {
      const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
      if (sourceLayer !== "transportation" && !/road|street|path/i.test(layer.id)) continue;
      const opacity = map.getPaintProperty(layer.id, "line-opacity");
      if (typeof opacity === "number") {
        setPaintSafe(map, layer.id, "line-opacity", Math.min(1, Math.max(opacity, 0.92)));
      } else if (opacity == null) {
        setPaintSafe(map, layer.id, "line-opacity", 1);
      }
      const blur = map.getPaintProperty(layer.id, "line-blur");
      if (typeof blur === "number" && blur > 0) {
        setPaintSafe(map, layer.id, "line-blur", 0);
      }
      const color = map.getPaintProperty(layer.id, "line-color");
      if (typeof color === "string") {
        const lifted = liftMutedColor(color, 0.38);
        if (lifted) setPaintSafe(map, layer.id, "line-color", lifted);
      }
    }
  }
}

export function RunningMap({
  mapStyleUrl,
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
  const mapRef = useRef<MapLibreMap | null>(null);
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
    if (!containerRef.current) return;

    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const start = userLocationRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveMapStyle(mapStyleUrl),
      center: start ? [start.lng, start.lat] : [151.2093, -33.8688],
      zoom: start ? 15.2 : 14.6,
      minZoom: 10,
      maxZoom: 19,
      fadeDuration: 0,
      pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      canvasContextAttributes: {
        antialias: true,
        powerPreference: "high-performance",
      },
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const emitBounds = () => {
      if (map.getZoom() >= 12.2) boundsChangeRef.current(getViewportBounds(map));
    };

    map.once("load", () => {
      const here = userLocationRef.current;
      if (here) map.jumpTo({ center: [here.lng, here.lat], zoom: 15.2 });
    });

    map.on("style.load", () => {
      originalRoadFilters.clear();
      originalRoadVisibility.clear();
      map.addSource("runner-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "runner-route-glow",
        type: "line",
        source: "runner-route",
        paint: {
          "line-color": "#b8ff3d",
          "line-width": 12,
          "line-opacity": 0.16,
          "line-blur": 7,
        },
      });
      map.addLayer({
        id: "runner-route",
        type: "line",
        source: "runner-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#c8ff52",
          "line-width": 5,
        },
      });

      map.addSource("runner-waypoints", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "runner-waypoints-hit",
        type: "circle",
        source: "runner-waypoints",
        paint: { "circle-radius": 18, "circle-opacity": 0 },
      });
      map.addLayer({
        id: "runner-waypoints",
        type: "circle",
        source: "runner-waypoints",
        paint: {
          "circle-radius": 8,
          "circle-color": "#111713",
          "circle-stroke-color": "#c8ff52",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "runner-waypoint-labels",
        type: "symbol",
        source: "runner-waypoints",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 10,
          "text-font": ["Noto Sans Regular"],
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "user-location-halo",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 16,
          "circle-color": "#5ad4ff",
          "circle-opacity": 0.18,
        },
      });
      map.addLayer({
        id: "user-location",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#7ee8ff",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource("runner-features", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      addFeatureImages(map);
      map.addLayer({
        id: "runner-features-halo",
        type: "circle",
        source: "runner-features",
        paint: {
          "circle-radius": 14,
          "circle-opacity": 0,
        },
      });
      map.addLayer({
        id: "runner-features-unclustered",
        type: "symbol",
        source: "runner-features",
        layout: {
          "icon-image": ["concat", "runner-feature-", ["get", "kind"]],
          "icon-size": 0.88,
          "icon-padding": 0,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      addRoadHighlightLayers(map);
      styleBaseMap(map, layersRef.current);
      for (const layerId of [
        "runner-route-glow",
        "runner-route",
        "runner-features-halo",
        "runner-features-unclustered",
        "user-location-halo",
        "user-location",
        "runner-waypoints-hit",
        "runner-waypoints",
        "runner-waypoint-labels",
      ]) {
        if (map.getLayer(layerId)) map.moveLayer(layerId);
      }

      updateRouteSource(map, routeCoordinatesRef.current);
      updateWaypointSource(map, pointsRef.current);
      updateFeatureSource(map, featuresRef.current, layersRef.current, routeCoordinatesRef.current);
      updateUserLocationSource(map, userLocationRef.current);
      emitBounds();
    });

    map.on("moveend", emitBounds);
    map.on("click", (event: MapMouseEvent) => {
      const featureHits = map.queryRenderedFeatures(event.point, {
        layers: ["runner-features-unclustered", "runner-features-halo"],
      });
      if (featureHits.length > 0 || didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      addPointRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    map.on(
      "click",
      "runner-features-unclustered",
      (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
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
        new maplibregl.Popup({ offset: 10, closeButton: false })
          .setLngLat([lng, lat])
          .setDOMContent(wrapper)
          .addTo(map);
      },
    );

    map.on(
      "mousedown",
      "runner-waypoints-hit",
      (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const feature = event.features?.[0];
        const index = Number(feature?.properties?.index);
        if (!Number.isInteger(index)) return;
        draggedPointRef.current = index;
        didDragRef.current = true;
        map.dragPan.disable();
        map.getCanvas().style.cursor = "grabbing";
        event.preventDefault();
      },
    );

    const onMouseMove = (event: MapMouseEvent) => {
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
  }, [mapStyleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    updateRouteSource(map, routeCoordinates);
    updateFeatureSource(map, featuresRef.current, layersRef.current, routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    updateWaypointSource(map, points);
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    updateFeatureSource(map, features, layers, routeCoordinatesRef.current);
  }, [features, layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    styleBaseMap(map, layers);
  }, [layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    updateUserLocationSource(map, userLocation);
  }, [userLocation]);

  useEffect(() => {
    if (!focusPoint) return;
    mapRef.current?.flyTo({
      center: [focusPoint.lng, focusPoint.lat],
      zoom: 15.2,
      duration: 900,
    });
  }, [focusPoint]);

  return <section ref={containerRef} className="h-full w-full" aria-label="Sydney running map" />;
}
