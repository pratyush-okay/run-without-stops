import { profileFromClerkUser } from "@/lib/auth/profile";

describe("profileFromClerkUser", () => {
  it("prefers a Clerk username and primary email", () => {
    expect(
      profileFromClerkUser({
        id: "user_123",
        username: "Night_Runner",
        firstName: "Ada",
        lastName: "King",
        primaryEmailAddress: { emailAddress: "ada@example.com" },
      }),
    ).toEqual({
      clerkId: "user_123",
      username: "night_runner",
      email: "ada@example.com",
      displayName: "Ada King",
    });
  });

  it("falls back to unsafe metadata username and webhook email fields", () => {
    expect(
      profileFromClerkUser({
        id: "user_456",
        first_name: "Sam",
        email_addresses: [{ email_address: "sam@example.com" }],
        unsafe_metadata: { username: "park_loops" },
      }),
    ).toEqual({
      clerkId: "user_456",
      username: "park_loops",
      email: "sam@example.com",
      displayName: "Sam",
    });
  });

  it("ignores invalid usernames", () => {
    expect(
      profileFromClerkUser({
        id: "user_789",
        username: "ab",
        unsafeMetadata: { username: "no spaces" },
      }),
    ).toEqual({
      clerkId: "user_789",
      username: null,
      email: null,
      displayName: null,
    });
  });
});
