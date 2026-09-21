import { waypointLabelKey } from "@/lib/agent/plan-run";
import { distanceMeters } from "@/lib/geo";
import { snapLoopPoints } from "@/lib/osm/walkable";
import { fetchBestRoute } from "@/lib/routing";
import { closeRouteLoop, isRouteLoop } from "@/lib/routing/points";
import type { AgentRouteProposal } from "@/lib/schemas/agent";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteMode, RouteRequest, RouteResponse } from "@/lib/schemas/route";

export type RealizeRouteDeps = {
  snapLoopPoints?: (points: GeoPoint[]) => Promise<GeoPoint[]>;
  fetchRoute?: (input: RouteRequest) => Promise<RouteResponse>;
};

function remapLabels(proposal: AgentRouteProposal, points: GeoPoint[]) {
  const labels: Record<string, string> = {};
  const start = points[0];
  if (start) labels[waypointLabelKey(start)] = "Start";
  for (const included of proposal.included) {
    let best: GeoPoint | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const point of points) {
      const distance = distanceMeters(included.point, point);
      if (distance < bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    if (best && bestDistance <= 500) labels[waypointLabelKey(best)] = included.name;
  }
  return labels;
}

function takeEvenly(points: GeoPoint[], count: number) {
  if (points.length <= count) return points;
  const picked: GeoPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const source = points[Math.round((index * (points.length - 1)) / (count - 1))];
    if (source) picked.push(source);
  }
  return picked;
}

async function tryRoute(
  fetchRoute: (input: RouteRequest) => Promise<RouteResponse>,
  points: GeoPoint[],
  mode: RouteMode,
  avoidElevation: boolean,
) {
  try {
    return await fetchRoute({ points, mode, avoidElevation, features: [] });
  } catch {
    return undefined;
  }
}

export async function realizeLoopRoute(
  proposal: AgentRouteProposal,
  deps: RealizeRouteDeps = {},
): Promise<AgentRouteProposal> {
  const snap = deps.snapLoopPoints ?? snapLoopPoints;
  const fetchRoute = deps.fetchRoute ?? fetchBestRoute;
  let snapped = proposal.points;
  try {
    snapped = await snap(proposal.points);
  } catch {
    snapped = proposal.points;
  }

  const open = isRouteLoop(snapped) ? snapped.slice(0, -1) : snapped;
  const attempts: { points: GeoPoint[]; mode: RouteMode }[] = [
    { points: snapped, mode: proposal.mode },
    { points: snapped, mode: "direct" },
  ];
  if (open.length > 3) {
    attempts.push({ points: closeRouteLoop(takeEvenly(open, 3)), mode: "direct" });
  }

  for (const attempt of attempts) {
    const route = await tryRoute(fetchRoute, attempt.points, attempt.mode, proposal.avoidElevation);
    if (!route) continue;
    return {
      ...proposal,
      points: attempt.points,
      mode: attempt.mode,
      knownLabels: remapLabels(proposal, attempt.points),
      route,
    };
  }

  return {
    ...proposal,
    points: snapped,
    knownLabels: remapLabels(proposal, snapped),
  };
}
