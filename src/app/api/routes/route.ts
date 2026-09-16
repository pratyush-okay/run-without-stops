import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEvent } from "@/lib/analytics/server";
import { profileFromClerkUser } from "@/lib/auth/profile";
import { reportError } from "@/lib/observability/report-error";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { savedRouteListResponseSchema, saveRouteRequestSchema } from "@/lib/schemas/saved-route";
import { upsertProfile } from "@/lib/supabase/profiles";
import { createSavedRoute, listSavedRoutes } from "@/lib/supabase/saved-routes";

function unavailable() {
  return NextResponse.json(apiErrorSchema.parse({ error: "Saving routes is not configured" }), {
    status: 503,
  });
}

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }

  try {
    const routes = await listSavedRoutes(user.id);
    if (!routes) return unavailable();
    return NextResponse.json(savedRouteListResponseSchema.parse({ routes }));
  } catch (error) {
    reportError(error, { route: "/api/routes" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Saved routes could not be loaded" }), {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to save a route" }), {
      status: 401,
    });
  }

  const parsed = saveRouteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Name and save a complete route" }), {
      status: 400,
    });
  }

  try {
    await upsertProfile(profileFromClerkUser(user));
    const saved = await createSavedRoute(user.id, parsed.data);
    if (!saved) return unavailable();
    await captureRequestEvent(
      request,
      analyticsEvents.routeSaved,
      {
        mode: saved.mode,
        distance_meters: saved.distanceMeters,
        point_count: saved.points.length,
      },
      user.id,
    );
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    reportError(error, { route: "/api/routes" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Route could not be saved" }), {
      status: 500,
    });
  }
}
