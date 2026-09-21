import { currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/agent/admin";
import { getResolvedAgentSettings, updateAgentSettings } from "@/lib/agent/runtime";
import { GET, PATCH } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/agent/admin", () => ({
  isAdminUser: vi.fn(),
}));

vi.mock("@/lib/agent/runtime", () => ({
  getResolvedAgentSettings: vi.fn(),
  updateAgentSettings: vi.fn(),
}));

const settings = {
  models: [
    {
      id: "openai/gpt-4.1-mini",
      label: "GPT-4.1 Mini",
      appId: "chat" as const,
      enabledByDefault: true,
      systemPrompt: "hi",
      enabled: true,
    },
  ],
  enabledModels: [
    {
      id: "openai/gpt-4.1-mini",
      label: "GPT-4.1 Mini",
      appId: "chat" as const,
      enabledByDefault: true,
      systemPrompt: "hi",
      enabled: true,
    },
  ],
  defaultModelId: "openai/gpt-4.1-mini",
};

describe("GET /api/admin/models", () => {
  it("rejects signed-out requests", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("rejects signed-in non-admins", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(isAdminUser).mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access required" });
  });

  it("returns the catalog with enabled flags", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_admin" } as never);
    vi.mocked(isAdminUser).mockReturnValue(true);
    vi.mocked(getResolvedAgentSettings).mockResolvedValue(settings);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      models: [{ id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", enabled: true }],
      defaultModelId: "openai/gpt-4.1-mini",
    });
  });
});

describe("PATCH /api/admin/models", () => {
  it("rejects signed-in non-admins", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(isAdminUser).mockReturnValue(false);

    const response = await PATCH(
      new Request("http://localhost/api/admin/models", {
        method: "PATCH",
        body: JSON.stringify({ enabledModelIds: ["openai/gpt-4.1-mini"] }),
      }),
    );

    expect(response.status).toBe(403);
    expect(updateAgentSettings).not.toHaveBeenCalled();
  });

  it("saves enabled models for an admin", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_admin" } as never);
    vi.mocked(isAdminUser).mockReturnValue(true);
    vi.mocked(updateAgentSettings).mockResolvedValue(settings);

    const response = await PATCH(
      new Request("http://localhost/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabledModelIds: ["openai/gpt-4.1-mini"],
          defaultModelId: "openai/gpt-4.1-mini",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateAgentSettings).toHaveBeenCalledWith({
      enabledModelIds: ["openai/gpt-4.1-mini"],
      defaultModelId: "openai/gpt-4.1-mini",
    });
  });
});
