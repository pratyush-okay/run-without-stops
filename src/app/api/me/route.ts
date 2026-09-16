import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { profileFromClerkUser } from "@/lib/auth/profile";
import { reportError } from "@/lib/observability/report-error";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { profileResponseSchema } from "@/lib/schemas/profile";
import { upsertProfile } from "@/lib/supabase/profiles";

export async function POST() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Sign in to continue" }), {
      status: 401,
    });
  }

  const profile = profileFromClerkUser(user);

  try {
    const persisted = await upsertProfile(profile);
    await captureServerEvent({
      distinctId: user.id,
      event: analyticsEvents.profileSynced,
      properties: { persisted },
    });
    return NextResponse.json(
      profileResponseSchema.parse({
        ...profile,
        persisted,
      }),
    );
  } catch (error) {
    reportError(error, { route: "/api/me" });
    return NextResponse.json(
      profileResponseSchema.parse({
        ...profile,
        persisted: false,
      }),
    );
  }
}
