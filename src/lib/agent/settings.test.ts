import { AGENT_MODEL_CATALOG } from "@/lib/agent/catalog";
import {
  isEnabledModelId,
  resolveAgentSettings,
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
