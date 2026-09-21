import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEventAfterResponse } from "@/lib/analytics/server";
import { canLoadRunnerFeatures, quantizeBoundingBox } from "@/lib/geo";
import { reportError } from "@/lib/observability/report-error";
import { fetchRunnerFeatures } from "@/lib/osm/overpass";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { boundingBoxSchema, featuresResponseSchema } from "@/lib/schemas/features";

const emptyFeatures = featuresResponseSchema.parse({
  features: [],
  attribution: "© OpenStreetMap contributors",
  partial: false,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = boundingBoxSchema.safeParse({
    south: Number(url.searchParams.get("south")),
    west: Number(url.searchParams.get("west")),
    north: Number(url.searchParams.get("north")),
    east: Number(url.searchParams.get("east")),
  });

  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Invalid map bounds" }), {
      status: 400,
    });
  }

  if (!canLoadRunnerFeatures(parsed.data)) {
    return NextResponse.json(emptyFeatures, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    const result = await fetchRunnerFeatures(quantizeBoundingBox(parsed.data));
    const body = featuresResponseSchema.parse({
      features: result.features,
      attribution: "© OpenStreetMap contributors",
      partial: result.partial,
    });
    captureRequestEventAfterResponse(request, analyticsEvents.featuresLoaded, {
      feature_count: body.features.length,
      partial: body.partial,
    });
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    reportError(error, { route: "/api/features" });
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Runner map data is temporarily unavailable" }),
      { status: 502 },
    );
  }
}
