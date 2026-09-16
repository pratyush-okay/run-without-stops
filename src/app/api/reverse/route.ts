import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEvent } from "@/lib/analytics/server";
import { reverseSydney } from "@/lib/maps/stadia";
import { reportError } from "@/lib/observability/report-error";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { geoPointSchema } from "@/lib/schemas/features";
import { reverseResponseSchema } from "@/lib/schemas/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = geoPointSchema.safeParse({
    lat: Number(url.searchParams.get("lat")),
    lng: Number(url.searchParams.get("lng")),
  });

  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Invalid map point" }), { status: 400 });
  }

  try {
    const body = reverseResponseSchema.parse({ label: await reverseSydney(parsed.data) });
    await captureRequestEvent(request, analyticsEvents.placeReversed, {
      has_label: Boolean(body.label),
    });
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    reportError(error, { route: "/api/reverse" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Place name could not be found" }), {
      status: 502,
    });
  }
}
