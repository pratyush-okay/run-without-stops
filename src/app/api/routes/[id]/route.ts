import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureRequestEvent, captureServerEvent } from "@/lib/analytics/server";
import { reportError } from "@/lib/observability/report-error";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { renameRouteRequestSchema, savedRouteSchema } from "@/lib/schemas/saved-route";
import {
  deleteSavedRoute,
  getOwnedSavedRoute,
  renameSavedRoute,
} from "@/lib/supabase/saved-routes";

type RouteContext = { params: Promise<{ id: string }> };

function unavailable() {
  return NextResponse.json(apiErrorSchema.parse({ error: "Saving routes is not configured" }), {
    status: 503,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }

  const { id } = await context.params;

  try {
    const saved = await getOwnedSavedRoute(user.id, id);
    if (saved === undefined) return unavailable();
    if (!saved) {
      return NextResponse.json(apiErrorSchema.parse({ error: "Route not found" }), { status: 404 });
    }
    await captureServerEvent({
      distinctId: user.id,
      event: analyticsEvents.savedRouteLoaded,
      properties: { route_id: saved.id, mode: saved.mode },
    });
    return NextResponse.json(savedRouteSchema.parse(saved));
  } catch (error) {
    reportError(error, { route: "/api/routes/[id]" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Route could not be loaded" }), {
      status: 500,
    });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }

  const parsed = renameRouteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Give the route a name" }), {
      status: 400,
    });
  }

  const { id } = await context.params;

  try {
    const saved = await renameSavedRoute(user.id, id, parsed.data.name);
    if (saved === undefined) return unavailable();
    if (!saved) {
      return NextResponse.json(apiErrorSchema.parse({ error: "Route not found" }), { status: 404 });
    }
    await captureRequestEvent(
      request,
      analyticsEvents.savedRouteRenamed,
      { route_id: saved.id },
      user.id,
    );
    return NextResponse.json(savedRouteSchema.parse(saved));
  } catch (error) {
    reportError(error, { route: "/api/routes/[id]" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Route could not be renamed" }), {
      status: 500,
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteSavedRoute(user.id, id);
    if (deleted === undefined) return unavailable();
    if (!deleted) {
      return NextResponse.json(apiErrorSchema.parse({ error: "Route not found" }), { status: 404 });
    }
    await captureServerEvent({
      distinctId: user.id,
      event: analyticsEvents.savedRouteDeleted,
      properties: { route_id: id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, { route: "/api/routes/[id]" });
    return NextResponse.json(apiErrorSchema.parse({ error: "Route could not be deleted" }), {
      status: 500,
    });
  }
}
