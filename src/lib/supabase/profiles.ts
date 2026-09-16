import type { Profile } from "@/lib/schemas/profile";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function upsertProfile(profile: Profile) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("profiles").upsert(
    {
      clerk_id: profile.clerkId,
      username: profile.username,
      email: profile.email,
      display_name: profile.displayName,
    },
    { onConflict: "clerk_id" },
  );

  if (error) throw error;
  return true;
}

export async function deleteProfile(clerkId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("profiles").delete().eq("clerk_id", clerkId);
  if (error) throw error;
  return true;
}
