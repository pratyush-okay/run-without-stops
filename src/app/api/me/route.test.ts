import { currentUser } from "@clerk/nextjs/server";
import { upsertProfile } from "@/lib/supabase/profiles";
import { POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/profiles", () => ({
  upsertProfile: vi.fn(),
}));

describe("POST /api/me", () => {
  it("rejects signed-out requests", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Sign in to continue" });
  });

  it("returns a profile and persistence flag", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user_123",
      username: "loop_runner",
      firstName: "Ada",
      lastName: null,
      primaryEmailAddress: { emailAddress: "ada@example.com" },
      emailAddresses: [{ emailAddress: "ada@example.com" }],
      unsafeMetadata: {},
    } as never);
    vi.mocked(upsertProfile).mockResolvedValue(true);

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      clerkId: "user_123",
      username: "loop_runner",
      email: "ada@example.com",
      displayName: "Ada",
      persisted: true,
    });
  });
});
