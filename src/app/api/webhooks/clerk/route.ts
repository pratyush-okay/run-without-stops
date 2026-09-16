import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { profileFromClerkUser } from "@/lib/auth/profile";
import { apiErrorSchema } from "@/lib/schemas/api-error";
import { deleteProfile, upsertProfile } from "@/lib/supabase/profiles";

export async function POST(request: NextRequest) {
  if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return NextResponse.json(apiErrorSchema.parse({ error: "Webhook is not configured" }), {
      status: 503,
    });
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json(apiErrorSchema.parse({ error: "Invalid webhook signature" }), {
      status: 400,
    });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      await upsertProfile(profileFromClerkUser(event.data));
    }

    if (event.type === "user.deleted" && event.data.id) {
      await deleteProfile(event.data.id);
    }
  } catch {
    return NextResponse.json(apiErrorSchema.parse({ error: "Could not sync profile" }), {
      status: 500,
    });
  }

  return new Response("OK", { status: 200 });
}
