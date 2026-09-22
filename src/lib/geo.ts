import type { BoundingBox, GeoPoint, RunnerFeature } from "@/lib/schemas/features";

const EARTH_RADIUS_METERS = 6_371_000;

export const SYDNEY_CENTER: GeoPoint = { lat: -33.8688, lng: 151.2093 };
export const FEATURES_VIEWPORT_MAX_METERS = 35_000;
export const WORLD_BOUNDS: BoundingBox = {
  south: -85,
  west: -180,
  north: 85,
  east: 180,
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

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function offsetPoint(origin: GeoPoint, meters: number, bearingDegrees: number): GeoPoint {
  const angular = meters / EARTH_RADIUS_METERS;
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(origin.lat);
  const lng1 = toRadians(origin.lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: toDegrees(lat2), lng: toDegrees(lng2) };
}

export function boxAround(origin: GeoPoint, radiusMeters: number): BoundingBox {
  const north = offsetPoint(origin, radiusMeters, 0);
  const east = offsetPoint(origin, radiusMeters, 90);
  const south = offsetPoint(origin, radiusMeters, 180);
  const west = offsetPoint(origin, radiusMeters, 270);
  return { south: south.lat, west: west.lng, north: north.lat, east: east.lng };
}

export function boundingBoxDiagonalMeters(box: BoundingBox) {
  return distanceMeters({ lat: box.south, lng: box.west }, { lat: box.north, lng: box.east });
}

export function canLoadRunnerFeatures(box: BoundingBox) {
  return boundingBoxDiagonalMeters(box) <= FEATURES_VIEWPORT_MAX_METERS;
}

export function viewportCenter(box: BoundingBox): GeoPoint {
  return {
    lat: (box.south + box.north) / 2,
    lng: (box.west + box.east) / 2,
  };
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

export type RouteSnap = {
  distance: number;
  point: GeoPoint;
  segmentIndex: number;
  t: number;
};

function lerpPoint(start: GeoPoint, finish: GeoPoint, t: number): GeoPoint {
  return {
    lat: start.lat + (finish.lat - start.lat) * t,
    lng: start.lng + (finish.lng - start.lng) * t,
  };
}

export function closestPointOnRoute(point: GeoPoint, route: GeoPoint[]): RouteSnap {
  let closest = Number.POSITIVE_INFINITY;
  let snapped = point;
  let segmentIndex = 0;
  let t = 0;

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
    segmentIndex = index;
    t = projection;
    snapped = lerpPoint(start, finish, projection);
  }

  return { distance: closest, point: snapped, segmentIndex, t };
}

export function bearingDegrees(from: GeoPoint, to: GeoPoint) {
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function smallestAngleDegrees(a: number, b: number) {
  return Math.abs(((b - a + 540) % 360) - 180);
}

function walkAlongRoute(
  route: GeoPoint[],
  segmentIndex: number,
  t: number,
  meters: number,
  direction: 1 | -1,
): GeoPoint | undefined {
  if (route.length < 2 || meters <= 0) return undefined;

  let index = segmentIndex;
  let localT = t;
  let remaining = meters;

  for (let guard = 0; guard < route.length + 2; guard += 1) {
    if (index < 0 || index >= route.length - 1) return undefined;
    const start = route[index];
    const finish = route[index + 1];
    if (!start || !finish) return undefined;

    const here = lerpPoint(start, finish, localT);
    if (direction === 1) {
      const toEnd = distanceMeters(here, finish);
      if (toEnd >= remaining) {
        return lerpPoint(here, finish, remaining / Math.max(toEnd, 1e-6));
      }
      remaining -= toEnd;
      index += 1;
      localT = 0;
      continue;
    }

    const toStart = distanceMeters(here, start);
    if (toStart >= remaining) {
      return lerpPoint(here, start, remaining / Math.max(toStart, 1e-6));
    }
    remaining -= toStart;
    index -= 1;
    localT = 1;
  }

  return undefined;
}

const TRAVEL_LOOKAHEAD_METERS = 24;
const THROUGH_TURN_DEGREES = 42;
const UNUSED_ARM_CONE_DEGREES = 36;
const ON_PATH_METERS = 7;

export function featureIsCrossedOnRoute(feature: RunnerFeature, route: GeoPoint[]) {
  if (feature.kind === "drinking_water") return true;
  if (route.length < 2) return false;

  const snap = closestPointOnRoute(feature.point, route);
  if (!Number.isFinite(snap.distance) || snap.distance > ROUTE_FEATURE_THRESHOLDS[feature.kind]) {
    return false;
  }

  const behind = walkAlongRoute(route, snap.segmentIndex, snap.t, TRAVEL_LOOKAHEAD_METERS, -1);
  const ahead = walkAlongRoute(route, snap.segmentIndex, snap.t, TRAVEL_LOOKAHEAD_METERS, 1);
  if (!behind || !ahead) return true;

  const inbound = bearingDegrees(behind, snap.point);
  const outbound = bearingDegrees(snap.point, ahead);
  if (smallestAngleDegrees(inbound, outbound) < THROUGH_TURN_DEGREES) return true;
  if (snap.distance < ON_PATH_METERS) return true;

  const unused = inbound;
  const featureBearing = bearingDegrees(snap.point, feature.point);
  const towardUnused = smallestAngleDegrees(featureBearing, unused);
  const towardOut = smallestAngleDegrees(featureBearing, outbound);
  const towardBack = smallestAngleDegrees(featureBearing, (inbound + 180) % 360);

  if (
    towardUnused < UNUSED_ARM_CONE_DEGREES &&
    towardUnused + 10 < towardOut &&
    towardUnused + 10 < towardBack
  ) {
    return false;
  }

  return towardOut <= UNUSED_ARM_CONE_DEGREES || towardBack <= UNUSED_ARM_CONE_DEGREES;
}

export function pointToRouteDistanceMeters(point: GeoPoint, route: GeoPoint[]) {
  return closestPointOnRoute(point, route).distance;
}

const GAP_FEATURE_METERS = 120;
const GAP_FEATURE_LIMIT = 40;

export function featuresForGap(features: RunnerFeature[], from: GeoPoint, to: GeoPoint) {
  const segment = [from, to];
  return features
    .filter((feature) => {
      if (feature.kind !== "traffic_signal" && feature.kind !== "crossing") return false;
      return pointToRouteDistanceMeters(feature.point, segment) <= GAP_FEATURE_METERS;
    })
    .slice(0, GAP_FEATURE_LIMIT);
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
  const onRoute = features.filter((feature) => {
    if (pointToRouteDistanceMeters(feature.point, route) > thresholds[feature.kind]) return false;
    return featureIsCrossedOnRoute(feature, route);
  });
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
