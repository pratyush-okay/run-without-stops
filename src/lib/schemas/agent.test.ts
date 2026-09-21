import { agentAdminUpdateSchema, agentChatRequestSchema } from "@/lib/schemas/agent";

describe("agent schemas", () => {
  it("accepts a chat request with UI message parts", () => {
    const parsed = agentChatRequestSchema.safeParse({
      modelId: "openai/gpt-4.1-mini",
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "hi" }],
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a chat request without messages", () => {
    expect(agentChatRequestSchema.safeParse({ modelId: "openai/gpt-4.1-mini" }).success).toBe(
      false,
    );
  });

  it("accepts an admin update", () => {
    const parsed = agentAdminUpdateSchema.safeParse({
      enabledModelIds: ["openai/gpt-4.1-mini"],
      defaultModelId: "openai/gpt-4.1-mini",
    });

    expect(parsed.success).toBe(true);
  });
});
