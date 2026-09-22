import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEventAfterResponse } from "@/lib/analytics/server";
import { reportError } from "@/lib/observability/report-error";
import { fetchBestRoute } from "@/lib/routing";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { routeRequestSchema, routeResponseSchema } from "@/lib/schemas/route";

export const maxDuration = 120;

export async function POST(request: Request) {
  const parsed = routeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Add at least a start and finish point" }),
      { status: 400 },
    );
  }

  try {
    const route = routeResponseSchema.parse(await fetchBestRoute(parsed.data));
    captureRequestEventAfterResponse(request, analyticsEvents.routeComputed, {
      mode: parsed.data.mode,
      point_count: parsed.data.points.length,
      provider: route.provider,
      distance_meters: route.metrics.distanceMeters,
      traffic_signals: route.metrics.trafficSignals,
      crossings: route.metrics.crossings,
    });
    return NextResponse.json(route);
  } catch (error) {
    reportError(error, { route: "/api/route" });
    captureRequestEventAfterResponse(request, analyticsEvents.routeComputeFailed, {
      mode: parsed.data.mode,
      point_count: parsed.data.points.length,
    });
    return NextResponse.json(
      apiErrorSchema.parse({ error: "A running route could not be calculated" }),
      { status: 502 },
    );
  }
}
