import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";

const EARTH_RADIUS_METERS = 6_371_000;

export const SYDNEY_CENTER: GeoPoint = { lat: -33.8688, lng: 151.2093 };
export const SYDNEY_BOUNDS: BoundingBox = {
  south: -34.22,
  west: 150.58,
  north: -33.48,
  east: 151.5,
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(a: GeoPoint, b: GeoPoint) {
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const value =
    Math.sin(latDelta / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(value));
}

export function boundingBoxDiagonalMeters(box: BoundingBox) {
  return distanceMeters({ lat: box.south, lng: box.west }, { lat: box.north, lng: box.east });
}

export function isWithinSydney(box: BoundingBox) {
  return (
    box.south >= SYDNEY_BOUNDS.south &&
    box.north <= SYDNEY_BOUNDS.north &&
    box.west >= SYDNEY_BOUNDS.west &&
    box.east <= SYDNEY_BOUNDS.east
  );
}

export function quantizeBoundingBox(box: BoundingBox, precision = 3): BoundingBox {
  const factor = 10 ** precision;
  return {
    south: Math.floor(box.south * factor) / factor,
    west: Math.floor(box.west * factor) / factor,
    north: Math.ceil(box.north * factor) / factor,
    east: Math.ceil(box.east * factor) / factor,
  };
}

export function closestPointOnRoute(point: GeoPoint, route: GeoPoint[]) {
  let closest = Number.POSITIVE_INFINITY;
  let snapped = point;

  for (let index = 0; index < route.length - 1; index += 1) {
    const start = route[index];
    const finish = route[index + 1];
    if (!start || !finish) continue;

    const latitudeScale = 111_320;
    const longitudeScale = latitudeScale * Math.cos(toRadians(point.lat));
    const x = (point.lng - start.lng) * longitudeScale;
    const y = (point.lat - start.lat) * latitudeScale;
    const dx = (finish.lng - start.lng) * longitudeScale;
    const dy = (finish.lat - start.lat) * latitudeScale;
    const segmentLength = dx * dx + dy * dy;
    const projection =
      segmentLength === 0 ? 0 : Math.max(0, Math.min(1, (x * dx + y * dy) / segmentLength));
    const distance = Math.hypot(x - projection * dx, y - projection * dy);
    if (distance >= closest) continue;

    closest = distance;
    snapped = {
      lat: start.lat + projection * (finish.lat - start.lat),
      lng: start.lng + projection * (finish.lng - start.lng),
    };
  }

  return { distance: closest, point: snapped };
}

export function pointToRouteDistanceMeters(point: GeoPoint, route: GeoPoint[]) {
  return closestPointOnRoute(point, route).distance;
}

export const ROUTE_FEATURE_THRESHOLDS: Record<RunnerFeature["kind"], number> = {
  traffic_signal: 16,
  crossing: 14,
  drinking_water: 140,
};

export const FEATURE_CLUSTER_METERS: Record<RunnerFeature["kind"], number> = {
  traffic_signal: 32,
  crossing: 42,
  drinking_water: 18,
};

function collapseNearbyFeatures(features: RunnerFeature[], route: GeoPoint[]) {
  const ranked = [...features].sort(
    (first, second) =>
      pointToRouteDistanceMeters(first.point, route) -
      pointToRouteDistanceMeters(second.point, route),
  );
  const kept: RunnerFeature[] = [];

  for (const feature of ranked) {
    const radius = FEATURE_CLUSTER_METERS[feature.kind];
    const duplicate = kept.some(
      (candidate) =>
        candidate.kind === feature.kind && distanceMeters(candidate.point, feature.point) <= radius,
    );
    if (!duplicate) kept.push(feature);
  }

  const unique = kept.filter((feature) => {
    if (feature.kind !== "crossing") return true;
    return !kept.some(
      (candidate) =>
        candidate.kind === "traffic_signal" &&
        distanceMeters(candidate.point, feature.point) <= FEATURE_CLUSTER_METERS.crossing,
    );
  });

  return unique.map((feature) => {
    if (feature.kind === "drinking_water") return feature;
    return { ...feature, point: closestPointOnRoute(feature.point, route).point };
  });
}

export function featuresNearRoute(
  features: RunnerFeature[],
  route: GeoPoint[],
  thresholds: Record<RunnerFeature["kind"], number> = ROUTE_FEATURE_THRESHOLDS,
) {
  if (route.length < 2) return [];
  const onRoute = features.filter(
    (feature) => pointToRouteDistanceMeters(feature.point, route) <= thresholds[feature.kind],
  );
  return collapseNearbyFeatures(onRoute, route);
}

export function countFeaturesNearRoute(
  features: RunnerFeature[],
  route: GeoPoint[],
  kind: RunnerFeature["kind"],
) {
  return featuresNearRoute(features, route).filter((feature) => feature.kind === kind).length;
}

export function signalAvoidancePolygons(
  features: RunnerFeature[],
  route: GeoPoint[] = [],
  limit = 24,
) {
  const signals = features.filter((feature) => feature.kind === "traffic_signal");
  if (route.length >= 2) {
    signals.sort(
      (first, second) =>
        pointToRouteDistanceMeters(first.point, route) -
        pointToRouteDistanceMeters(second.point, route),
    );
  }

  return signals.slice(0, limit).map((feature, index) => {
    const latitudeDelta = 18 / 111_320;
    const longitudeDelta = latitudeDelta / Math.cos(toRadians(feature.point.lat));
    const { lat, lng } = feature.point;
    return {
      type: "Feature" as const,
      id: `signal_${index}`,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [lng - longitudeDelta, lat - latitudeDelta],
            [lng + longitudeDelta, lat - latitudeDelta],
            [lng + longitudeDelta, lat + latitudeDelta],
            [lng - longitudeDelta, lat + latitudeDelta],
            [lng - longitudeDelta, lat - latitudeDelta],
          ],
        ],
      },
    };
  });
}
