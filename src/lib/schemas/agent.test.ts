import {
  agentAdminUpdateSchema,
  agentChatRequestSchema,
  agentPlanRunRequestSchema,
} from "@/lib/schemas/agent";

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

  it("accepts live planner context with a chat request", () => {
    const parsed = agentChatRequestSchema.safeParse({
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "make a 5km loop around me" }],
        },
      ],
      context: {
        location: { lat: -33.86, lng: 151.21 },
        unit: "metric",
        paceSecondsPerKm: 330,
      },
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

  it("accepts a plan-run request", () => {
    const parsed = agentPlanRunRequestSchema.safeParse({
      text: "Make a 6k loop around me",
      context: { unit: "metric" },
    });
    expect(parsed.success).toBe(true);
  });
});
