import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { profileFromClerkUser } from "@/lib/auth/profile";
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
    return NextResponse.json(
      profileResponseSchema.parse({
        ...profile,
        persisted: await upsertProfile(profile),
      }),
    );
  } catch {
    return NextResponse.json(
      profileResponseSchema.parse({
        ...profile,
        persisted: false,
      }),
    );
  }
}
