import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { deleteProfile, upsertProfile } from "@/lib/supabase/profiles";
import { POST } from "./route";

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(),
}));

vi.mock("@/lib/supabase/profiles", () => ({
  upsertProfile: vi.fn(),
  deleteProfile: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    CLERK_WEBHOOK_SIGNING_SECRET: "whsec_test",
  },
}));

describe("POST /api/webhooks/clerk", () => {
  it("rejects invalid signatures", async () => {
    vi.mocked(verifyWebhook).mockRejectedValue(new Error("bad signature"));

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/clerk", { method: "POST" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid webhook signature" });
  });

  it("upserts created users", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_123",
        username: "loop_runner",
        first_name: "Ada",
        email_addresses: [{ email_address: "ada@example.com" }],
      },
    } as never);
    vi.mocked(upsertProfile).mockResolvedValue(true);

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/clerk", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(upsertProfile).toHaveBeenCalledWith({
      clerkId: "user_123",
      username: "loop_runner",
      email: "ada@example.com",
      displayName: "Ada",
    });
  });

  it("deletes removed users", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_123" },
    } as never);
    vi.mocked(deleteProfile).mockResolvedValue(true);

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/clerk", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(deleteProfile).toHaveBeenCalledWith("user_123");
  });
});
