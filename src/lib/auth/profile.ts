import { type Profile, usernameSchema } from "@/lib/schemas/profile";

type ClerkLikeUser = {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses?: { emailAddress: string }[];
  email_addresses?: { email_address: string }[];
  unsafeMetadata?: Record<string, unknown> | null;
  unsafe_metadata?: Record<string, unknown> | null;
};

function metadataUsername(metadata: Record<string, unknown> | null | undefined) {
  const value = metadata?.username;
  const parsed = typeof value === "string" ? usernameSchema.safeParse(value) : undefined;
  return parsed?.success ? parsed.data : null;
}

function firstEmail(user: ClerkLikeUser) {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    user.email_addresses?.[0]?.email_address ??
    null
  );
}

function displayName(user: ClerkLikeUser) {
  const name = [user.firstName ?? user.first_name, user.lastName ?? user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name.length > 0 ? name : null;
}

export function profileFromClerkUser(user: ClerkLikeUser): Profile {
  const username = usernameSchema.safeParse(user.username).success
    ? usernameSchema.parse(user.username)
    : metadataUsername(user.unsafeMetadata ?? user.unsafe_metadata);

  return {
    clerkId: user.id,
    username,
    email: firstEmail(user),
    displayName: displayName(user),
  };
}
