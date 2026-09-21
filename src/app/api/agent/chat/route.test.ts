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

vi.mock("@/lib/osm/scenic", () => ({
  findScenicPlaces: vi.fn(async () => []),
}));

vi.mock("@/lib/maps/stadia", () => ({
  searchPlaces: vi.fn(async () => []),
}));

vi.mock("@/lib/osm/walkable", () => ({
  snapLoopPoints: vi.fn(async (points: unknown) => points),
}));

vi.mock("@/lib/routing", () => ({
  fetchBestRoute: vi.fn(async () => ({
    coordinates: [
      [151.2093, -33.8688],
      [151.215, -33.873],
      [151.2093, -33.8688],
    ],
    metrics: {
      distanceMeters: 6_000,
      durationSeconds: 1_980,
      trafficSignals: 0,
      crossings: 0,
      majorRoadMeters: 0,
    },
    provider: "graphhopper",
    warnings: [],
  })),
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

  it("rejects when no model is active", async () => {
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
    await expect(response.json()).resolves.toEqual({ error: "No models are active" });
    expect(createAgentModel).not.toHaveBeenCalled();
  });

  it("rejects an empty body", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);
    vi.mocked(hasOpenRouterKey).mockReturnValue(true);

    const response = await POST(chatRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Send a message" });
  });

  it("builds a 6k loop without calling the LLM", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);
    vi.mocked(hasOpenRouterKey).mockReturnValue(false);

    const response = await POST(
      chatRequest({
        messages: [
          {
            id: "m1",
            role: "user",
            parts: [{ type: "text", text: "Make a 6k loop around me" }],
          },
        ],
        context: { mapCenter: { lat: -33.8688, lng: 151.2093 }, unit: "metric" },
      }),
    );

    expect(response.status).toBe(200);
    expect(createAgentModel).not.toHaveBeenCalled();
    const body = await response.text();
    expect(body).toMatch(/6\.00 km loop/);
    expect(body).toMatch(/It's on the map/);
  });
});
