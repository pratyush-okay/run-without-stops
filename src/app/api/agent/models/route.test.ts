import { currentUser } from "@clerk/nextjs/server";
import { canUseAgentChat } from "@/lib/agent/admin";
import { getResolvedAgentSettings } from "@/lib/agent/runtime";
import { GET } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/agent/admin", () => ({
  canUseAgentChat: vi.fn(),
}));

vi.mock("@/lib/agent/runtime", () => ({
  getResolvedAgentSettings: vi.fn(),
}));

describe("GET /api/agent/models", () => {
  it("rejects signed-out requests", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Sign in to continue" });
  });

  it("rejects signed-in non-admins", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access required" });
  });

  it("returns only enabled models", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);
    vi.mocked(getResolvedAgentSettings).mockResolvedValue({
      models: [
        {
          id: "openai/gpt-4.1-mini",
          label: "GPT-4.1 Mini",
          appId: "chat",
          enabledByDefault: true,
          systemPrompt: "hi",
          enabled: true,
        },
        {
          id: "google/gemini-2.5-flash",
          label: "Gemini 2.5 Flash",
          appId: "chat",
          enabledByDefault: false,
          systemPrompt: "hi",
          enabled: false,
        },
      ],
      enabledModels: [
        {
          id: "openai/gpt-4.1-mini",
          label: "GPT-4.1 Mini",
          appId: "chat",
          enabledByDefault: true,
          systemPrompt: "hi",
          enabled: true,
        },
      ],
      defaultModelId: "openai/gpt-4.1-mini",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      models: [{ id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" }],
      defaultModelId: "openai/gpt-4.1-mini",
    });
  });
});
