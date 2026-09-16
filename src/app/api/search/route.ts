import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEvent } from "@/lib/analytics/server";
import { searchSydney } from "@/lib/maps/stadia";
import { reportError } from "@/lib/observability/report-error";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { searchResponseSchema } from "@/lib/schemas/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Search must be between 2 and 100 characters" }),
      { status: 400 },
    );
  }

  try {
    const body = searchResponseSchema.parse({ results: await searchSydney(query) });
    await captureRequestEvent(request, analyticsEvents.placeSearched, {
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
