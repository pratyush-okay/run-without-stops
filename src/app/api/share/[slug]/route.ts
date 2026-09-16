import { NextResponse } from "next/server";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { savedRouteSchema, shareSlugSchema } from "@/lib/schemas/saved-route";
import { getSavedRouteBySlug } from "@/lib/supabase/saved-routes";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const parsed = shareSlugSchema.safeParse((await context.params).slug);
  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Invalid share link" }), {
      status: 400,
    });
  }

  try {
    const saved = await getSavedRouteBySlug(parsed.data);
    if (saved === undefined) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: "Shared routes are not configured" }),
        {
          status: 503,
        },
      );
    }
    if (!saved) {
      return NextResponse.json(apiErrorSchema.parse({ error: "This shared route was not found" }), {
        status: 404,
      });
    }
    return NextResponse.json(savedRouteSchema.parse(saved), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(apiErrorSchema.parse({ error: "Shared route could not be loaded" }), {
      status: 500,
    });
  }
}
