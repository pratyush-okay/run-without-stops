import { evaluateRouteDraw, routeDrawFromEvaluation } from "@/lib/agent/jev";

function answers({
  intent = "build",
  intentProbability = 0.91,
  mode = "unchanged",
  modeProbability = 0.2,
  avoidHills = 0.1,
  includePark = 0.1,
  includeLake = 0.1,
  includeWater = 0.1,
  omitIntentProbabilities = false,
}: {
  intent?: "build" | "tweak" | "explain";
  intentProbability?: number;
  mode?: "direct" | "low_stops" | "unchanged";
  modeProbability?: number;
  avoidHills?: number;
  includePark?: number;
  includeLake?: number;
  includeWater?: number;
  omitIntentProbabilities?: boolean;
} = {}) {
  const rest = Math.max(0, (1 - intentProbability) / 2);
  return {
    intent: {
      type: "choice" as const,
      choice: intent,
      ...(omitIntentProbabilities
        ? {}
        : {
            probabilities: {
              build: intent === "build" ? intentProbability : rest,
              tweak: intent === "tweak" ? intentProbability : rest,
              explain: intent === "explain" ? intentProbability : rest,
            },
          }),
    },
    mode: {
      type: "choice" as const,
      choice: mode,
      probabilities: {
        direct: mode === "direct" ? modeProbability : 0.05,
        low_stops: mode === "low_stops" ? modeProbability : 0.05,
        unchanged: mode === "unchanged" ? modeProbability : 0.05,
      },
    },
    avoidHills: { type: "boolean" as const, probability: avoidHills },
    includePark: { type: "boolean" as const, probability: includePark },
    includeLake: { type: "boolean" as const, probability: includeLake },
    includeWater: { type: "boolean" as const, probability: includeWater },
  };
}

describe("routeDrawFromEvaluation", () => {
  it("draws when a build is at least 80 percent sure", () => {
    expect(
      routeDrawFromEvaluation(
        answers({
          intent: "build",
          intentProbability: 0.8,
          mode: "low_stops",
          modeProbability: 0.9,
          avoidHills: 0.91,
          includePark: 0.95,
        }),
      ),
    ).toEqual({
      mode: "low_stops",
      avoidElevation: true,
      includePark: true,
    });
  });

  it("draws a tweak the same way", () => {
    expect(routeDrawFromEvaluation(answers({ intent: "tweak", intentProbability: 0.88 }))).toEqual(
      {},
    );
  });

  it("skips a build below 80 percent", () => {
    expect(routeDrawFromEvaluation(answers({ intentProbability: 0.79 }))).toBeNull();
  });

  it("skips an explanation even when it is sure", () => {
    expect(
      routeDrawFromEvaluation(answers({ intent: "explain", intentProbability: 0.99 })),
    ).toBeNull();
  });

  it("skips a choice that has no probability", () => {
    expect(routeDrawFromEvaluation(answers({ omitIntentProbabilities: true }))).toBeNull();
  });

  it("leaves weak scenic and hill signals for the text parser", () => {
    expect(
      routeDrawFromEvaluation(
        answers({
          mode: "direct",
          modeProbability: 0.7,
          avoidHills: 0.79,
          includeWater: 0.5,
        }),
      ),
    ).toEqual({});
  });
});

describe("evaluateRouteDraw", () => {
  it("does nothing when the gateway key is absent", async () => {
    await expect(evaluateRouteDraw("flatten this")).resolves.toBeNull();
  });

  it("returns null when Jev times out", async () => {
    const result = await evaluateRouteDraw("flatten this", {
      timeoutMs: 20,
      evaluate: (_state, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            reject(signal.reason);
          });
        }),
    });

    expect(result).toBeNull();
  });

  it("returns null when Jev throws", async () => {
    await expect(
      evaluateRouteDraw("flatten this", {
        evaluate: async () => {
          throw new Error("gateway down");
        },
      }),
    ).resolves.toBeNull();
  });

  it("returns the draw when the injected evaluation is confident", async () => {
    await expect(
      evaluateRouteDraw("flatten this", {
        evaluate: async () =>
          ({
            answers: answers({ avoidHills: 0.93 }),
          }) as never,
      }),
    ).resolves.toEqual({ avoidElevation: true });
  });
});
