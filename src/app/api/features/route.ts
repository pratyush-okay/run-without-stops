import { NextResponse } from "next/server";
import { boundingBoxDiagonalMeters, isWithinSydney, quantizeBoundingBox } from "@/lib/geo";
import { fetchRunnerFeatures } from "@/lib/osm/overpass";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { boundingBoxSchema, featuresResponseSchema } from "@/lib/schemas/features";

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

  if (!isWithinSydney(parsed.data) || boundingBoxDiagonalMeters(parsed.data) > 35_000) {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Zoom further into the Sydney launch area" }),
      { status: 400 },
    );
  }

  try {
    const result = await fetchRunnerFeatures(quantizeBoundingBox(parsed.data));
    const body = featuresResponseSchema.parse({
      features: result.features,
      attribution: "© OpenStreetMap contributors",
      partial: result.partial,
    });
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      apiErrorSchema.parse({ error: "Runner map data is temporarily unavailable" }),
      { status: 502 },
    );
  }
}
