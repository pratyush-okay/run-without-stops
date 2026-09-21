import { AGENT_MODEL_CATALOG } from "@/lib/agent/catalog";
import {
  agentChatErrorMessage,
  fallbackModelIds,
  isEnabledModelId,
  resolveAgentSettings,
  runtimeModelId,
  sanitizeStoredSettings,
} from "@/lib/agent/settings";

const catalog = AGENT_MODEL_CATALOG;

describe("resolveAgentSettings", () => {
  it("uses catalog defaults when nothing is stored", () => {
    const resolved = resolveAgentSettings(null, catalog);
    const enabledIds = resolved.enabledModels.map((model) => model.id);

    expect(enabledIds).toEqual(
      catalog.filter((model) => model.enabledByDefault).map((model) => model.id),
    );
    expect(resolved.defaultModelId).toBe(enabledIds[0]);
  });

  it("treats a stored empty list as all off", () => {
    const resolved = resolveAgentSettings(
      { enabledModelIds: [], defaultModelId: "google/gemma-4-31b-it:free" },
      catalog,
    );

    expect(resolved.enabledModels).toEqual([]);
    expect(resolved.defaultModelId).toBeUndefined();
  });

  it("ignores unknown model ids and a disabled default", () => {
    const resolved = resolveAgentSettings(
      {
        enabledModelIds: ["google/gemma-4-31b-it:free", "not-a-model"],
        defaultModelId: "ibm-granite/granite-4.0-h-micro",
      },
      catalog,
    );

    expect(resolved.enabledModels.map((model) => model.id)).toEqual(["google/gemma-4-31b-it:free"]);
    expect(resolved.defaultModelId).toBe("google/gemma-4-31b-it:free");
    expect(isEnabledModelId("ibm-granite/granite-4.0-h-micro", resolved)).toBe(false);
  });
});

describe("runtimeModelId", () => {
  it("prefers a paid enabled model over a free default", () => {
    const resolved = resolveAgentSettings(
      {
        enabledModelIds: ["google/gemma-4-31b-it:free", "mistralai/mistral-nemo"],
        defaultModelId: "google/gemma-4-31b-it:free",
      },
      catalog,
    );

    expect(runtimeModelId(resolved)).toBe("mistralai/mistral-nemo");
  });
});

describe("fallbackModelIds", () => {
  it("puts paid models ahead of free ones", () => {
    const resolved = resolveAgentSettings(null, catalog);
    expect(fallbackModelIds("mistralai/mistral-nemo", resolved)).toEqual([
      "google/gemma-4-31b-it:free",
      "qwen/qwen3.8-27b:free",
    ]);
  });
});

describe("agentChatErrorMessage", () => {
  it("maps rate limits to a short retry message", () => {
    expect(
      agentChatErrorMessage(new Error("google/gemma-4-31b-it:free is temporarily rate-limited")),
    ).toBe("That model is busy. Try again in a moment.");
  });
});

describe("sanitizeStoredSettings", () => {
  it("drops unknown ids and repairs the default", () => {
    expect(
      sanitizeStoredSettings(
        {
          enabledModelIds: ["google/gemma-4-31b-it:free", "missing"],
          defaultModelId: "missing",
        },
        catalog,
      ),
    ).toEqual({
      enabledModelIds: ["google/gemma-4-31b-it:free"],
      defaultModelId: "google/gemma-4-31b-it:free",
    });
  });
});
