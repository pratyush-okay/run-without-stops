import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEventAfterResponse } from "@/lib/analytics/server";
import { SYDNEY_CENTER } from "@/lib/geo";
import { searchPlaces } from "@/lib/maps/stadia";
import { reportError } from "@/lib/observability/report-error";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { geoPointSchema } from "@/lib/schemas/features";
import { searchResponseSchema } from "@/lib/schemas/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Search must be between 2 and 100 characters" }),
      { status: 400 },
    );
  }

  const focus = geoPointSchema.safeParse({
    lat: Number(url.searchParams.get("lat")),
    lng: Number(url.searchParams.get("lng")),
  });

  try {
    const body = searchResponseSchema.parse({
      results: await searchPlaces(query, focus.success ? focus.data : SYDNEY_CENTER),
    });
    captureRequestEventAfterResponse(request, analyticsEvents.placeSearched, {
      query_length: query.length,
      result_count: body.results.length,
    });
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    reportError(error, { route: "/api/search" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Search is temporarily unavailable" }), {
      status: 502,
    });
  }
}
