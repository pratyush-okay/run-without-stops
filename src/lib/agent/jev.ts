import { experimental_evaluate as evaluate } from "ai";
import { env } from "@/env";
import type { PlanRunInput } from "@/lib/agent/tools";

export const JEV_MODEL_ID = "typesafe-ai/jev";
export const JEV_CONFIDENCE = 0.8;
export const JEV_TIMEOUT_MS = 1_500;

const routeQuestions = {
  intent: {
    type: "choice" as const,
    instructions: "What should the running planner do with this message?",
    criteria: {
      build: "Draw a new running route or loop",
      tweak: "Change the route already being discussed",
      explain: "Answer a question or chat without drawing a route",
    },
  },
  mode: {
    type: "choice" as const,
    instructions: "Which routing style should the line use?",
    criteria: {
      direct: "Follow the requested order on pedestrian streets",
      low_stops: "Prefer fewer traffic lights and quieter streets",
      unchanged: "The message does not choose a routing style",
    },
  },
  avoidHills: {
    type: "boolean" as const,
    instructions: "Should the route avoid hills?",
    criteria: {
      true: "Flatten the line or avoid climbs",
      false: "Hills are fine or not mentioned",
    },
  },
  includePark: {
    type: "boolean" as const,
    instructions: "Should the route include a park?",
  },
  includeLake: {
    type: "boolean" as const,
    instructions: "Should the route include a lake?",
  },
  includeWater: {
    type: "boolean" as const,
    instructions: "Should the route include drinking water?",
  },
};

type RouteEvaluation = Awaited<ReturnType<typeof evaluate<typeof routeQuestions>>>;
type RouteAnswers = RouteEvaluation["answers"];

export type RouteEvaluator = (state: string, signal: AbortSignal) => Promise<RouteEvaluation>;

export function hasAiGatewayKey() {
  return Boolean(env.AI_GATEWAY_API_KEY);
}

function choiceConfidence(answer: { choice: string; probabilities?: Record<string, number> }) {
  const probability = answer.probabilities?.[answer.choice];
  return typeof probability === "number" ? probability : undefined;
}

function flagWhenSure(probability: number) {
  return probability >= JEV_CONFIDENCE ? true : undefined;
}

export function routeDrawFromEvaluation(answers: RouteAnswers): PlanRunInput | null {
  const { intent, mode, avoidHills, includePark, includeLake, includeWater } = answers;
  const intentConfidence = choiceConfidence(intent);
  if (
    intentConfidence == null ||
    intentConfidence < JEV_CONFIDENCE ||
    (intent.choice !== "build" && intent.choice !== "tweak")
  ) {
    return null;
  }

  const modeConfidence = choiceConfidence(mode);
  const draw: PlanRunInput = {};
  if (
    modeConfidence != null &&
    modeConfidence >= JEV_CONFIDENCE &&
    (mode.choice === "direct" || mode.choice === "low_stops")
  ) {
    draw.mode = mode.choice;
  }
  const hills = flagWhenSure(avoidHills.probability);
  const park = flagWhenSure(includePark.probability);
  const lake = flagWhenSure(includeLake.probability);
  const water = flagWhenSure(includeWater.probability);
  if (hills) draw.avoidElevation = true;
  if (park) draw.includePark = true;
  if (lake) draw.includeLake = true;
  if (water) draw.includeWater = true;
  return draw;
}

export async function evaluateRouteDraw(
  state: string,
  options: { evaluate?: RouteEvaluator; timeoutMs?: number } = {},
): Promise<PlanRunInput | null> {
  if (!options.evaluate && !hasAiGatewayKey()) return null;

  const timeoutMs = options.timeoutMs ?? JEV_TIMEOUT_MS;
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const result = options.evaluate
      ? await options.evaluate(state, signal)
      : await evaluate({
          model: JEV_MODEL_ID,
          state,
          questions: routeQuestions,
          maxRetries: 0,
          abortSignal: signal,
        });
    return routeDrawFromEvaluation(result.answers);
  } catch {
    return null;
  }
}
