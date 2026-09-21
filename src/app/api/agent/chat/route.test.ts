import { currentUser } from "@clerk/nextjs/server";
import { canUseAgentChat } from "@/lib/agent/admin";
import { createAgentModel, hasOpenRouterKey } from "@/lib/agent/openrouter";
import { getResolvedAgentSettings } from "@/lib/agent/runtime";
import { POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/agent/admin", () => ({
  canUseAgentChat: vi.fn(),
}));

vi.mock("@/lib/agent/openrouter", () => ({
  hasOpenRouterKey: vi.fn(),
  createAgentModel: vi.fn(),
}));

vi.mock("@/lib/agent/runtime", () => ({
  getResolvedAgentSettings: vi.fn(),
}));

const chatBody = {
  modelId: "openai/gpt-4.1-mini",
  messages: [
    {
      id: "m1",
      role: "user",
      parts: [{ type: "text", text: "hi" }],
    },
  ],
};

function chatRequest(body: unknown = chatBody) {
  return new Request("http://localhost/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/chat", () => {
  it("rejects signed-out requests", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await POST(chatRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Sign in to continue" });
  });

  it("rejects signed-in non-admins", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(false);

    const response = await POST(chatRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access required" });
  });

  it("returns 503 when OpenRouter is not configured", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);
    vi.mocked(hasOpenRouterKey).mockReturnValue(false);

    const response = await POST(chatRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Chat is not configured" });
  });

  it("rejects a disabled model", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);
    vi.mocked(hasOpenRouterKey).mockReturnValue(true);
    vi.mocked(getResolvedAgentSettings).mockResolvedValue({
      models: [],
      enabledModels: [],
      defaultModelId: undefined,
    });

    const response = await POST(chatRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "That model is not available" });
    expect(createAgentModel).not.toHaveBeenCalled();
  });

  it("rejects an empty body", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);
    vi.mocked(hasOpenRouterKey).mockReturnValue(true);

    const response = await POST(chatRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Send a message and a model" });
  });
});
