import { tool } from "ai";
import { z } from "zod";
import { mapActions } from "@/lib/agent/chat-ui";
import { inferLoopHints, normalizeDistanceKm, planRunLoop } from "@/lib/agent/plan-run";
import { type RealizeRouteDeps, realizeLoopRoute } from "@/lib/agent/realize-route";
import { SYDNEY_CENTER } from "@/lib/geo";
import { searchPlaces } from "@/lib/maps/stadia";
import { findScenicPlaces } from "@/lib/osm/scenic";
import { DEFAULT_PACE_SECONDS_PER_KM } from "@/lib/routing/format";
import type { AgentChatContext, AgentRouteProposal } from "@/lib/schemas/agent";
import { geoPointSchema } from "@/lib/schemas/features";
import { routeModeSchema } from "@/lib/schemas/route";

const planRunInputSchema = z.object({
  distanceKm: z.number().positive().max(42_000).optional(),
  distanceMiles: z.number().positive().max(26).optional(),
  durationMinutes: z.number().positive().max(300).optional(),
  includePark: z.boolean().optional(),
  includeLake: z.boolean().optional(),
  includeWater: z.boolean().optional(),
  namedPlaces: z.array(z.string().min(1).max(80)).max(6).optional(),
  origin: geoPointSchema.optional(),
  mode: routeModeSchema.optional(),
  avoidElevation: z.boolean().optional(),
});

export type PlanRunInput = z.infer<typeof planRunInputSchema>;

export type PlanRunSearch = typeof searchPlaces;
export type PlanRunScenic = typeof findScenicPlaces;

function resolveOrigin(input: PlanRunInput, context: AgentChatContext) {
  return input.origin ?? context.location ?? context.mapCenter ?? SYDNEY_CENTER;
}

export async function executePlanRun(
  input: PlanRunInput,
  context: AgentChatContext,
  options: {
    deps?: { searchPlaces: PlanRunSearch; findScenicPlaces: PlanRunScenic };
    userText?: string;
    realize?: RealizeRouteDeps | false;
  } = {},
): Promise<AgentRouteProposal> {
  const deps = options.deps ?? { searchPlaces, findScenicPlaces };
  const userText = options.userText ?? "";
  const hints = inferLoopHints(userText);
  const rawKm = input.distanceKm ?? hints.distanceKm;
  const distanceKm = rawKm == null ? undefined : normalizeDistanceKm(rawKm);
  const distanceMiles = input.distanceMiles ?? hints.distanceMiles;
  const durationMinutes = input.durationMinutes ?? hints.durationMinutes;
  const includePark = input.includePark ?? hints.includePark;
  const includeLake = input.includeLake ?? hints.includeLake;
  const includeWater = input.includeWater ?? hints.includeWater;

  let origin = resolveOrigin(input, context);
  const searchFocus = origin;
  const namedPlaces: { point: { lat: number; lng: number }; name: string }[] = [];
  for (const query of input.namedPlaces ?? []) {
    try {
      const results = await deps.searchPlaces(query, searchFocus);
      const match = results[0];
      if (match) namedPlaces.push({ point: match.point, name: match.label });
    } catch {
      // Named-place lookup is best-effort; the loop still builds without it.
    }
  }

  if (!input.origin && !context.location && !context.mapCenter && namedPlaces[0]) {
    origin = namedPlaces[0].point;
    namedPlaces.shift();
  }

  const wantsScenic = Boolean(includePark || includeLake || includeWater);
  let places: Awaited<ReturnType<PlanRunScenic>> = [];
  if (wantsScenic) {
    try {
      places = await deps.findScenicPlaces(origin, 3_200);
    } catch {
      places = [];
    }
  }

  const planned = planRunLoop({
    origin,
    namedPlaces,
    places,
    unit: context.unit ?? "metric",
    paceSecondsPerKm: context.paceSecondsPerKm ?? DEFAULT_PACE_SECONDS_PER_KM,
    ...(distanceKm == null ? {} : { distanceKm }),
    ...(distanceMiles == null ? {} : { distanceMiles }),
    ...(durationMinutes == null ? {} : { durationMinutes }),
    ...(includePark == null ? {} : { includePark }),
    ...(includeLake == null ? {} : { includeLake }),
    ...(includeWater == null ? {} : { includeWater }),
    ...(hints.waterHalfway ? { waterHalfway: true } : {}),
    ...(input.mode == null ? {} : { mode: input.mode }),
    ...(input.avoidElevation == null ? {} : { avoidElevation: input.avoidElevation }),
  });
  if (options.realize === false) return planned;
  return realizeLoopRoute(planned, options.realize ?? {});
}

export function createAgentTools(context: AgentChatContext, userText = "") {
  return {
    getRunContext: tool({
      description:
        "Read the runner's GPS, map center, unit, pace, and current route distance. Skip this for around-me loops — planRun already uses GPS/map center.",
      inputSchema: z.object({}),
      execute: async () => ({
        hasGps: Boolean(context.location),
        location: context.location,
        mapCenter: context.mapCenter,
        unit: context.unit ?? "metric",
        paceSecondsPerKm: context.paceSecondsPerKm ?? DEFAULT_PACE_SECONDS_PER_KM,
        currentDistanceMeters: context.currentDistanceMeters,
        startHint: context.location
          ? "Use GPS for around-me loops."
          : "No GPS. planRun will use mapCenter. Do not ask where they are.",
      }),
    }),
    searchPlaces: tool({
      description: "Geocode a named park, lake, neighborhood, or address near the runner.",
      inputSchema: z.object({
        query: z.string().min(2).max(120),
      }),
      execute: async ({ query }) => {
        const focus = context.location ?? context.mapCenter ?? SYDNEY_CENTER;
        const results = await searchPlaces(query, focus);
        return { query, results: results.slice(0, 5) };
      },
    }),
    findScenicPlaces: tool({
      description: "Find nearby parks, lakes, and drinking-water points around the start.",
      inputSchema: z.object({
        radiusMeters: z.number().min(400).max(8_000).optional(),
        kinds: z
          .array(z.enum(["park", "lake", "water"]))
          .max(3)
          .optional(),
      }),
      execute: async ({ radiusMeters, kinds }) => {
        const origin = context.location ?? context.mapCenter ?? SYDNEY_CENTER;
        const places = await findScenicPlaces(origin, radiusMeters ?? 2_500);
        return {
          origin,
          places: kinds?.length ? places.filter((place) => kinds.includes(place.kind)) : places,
        };
      },
    }),
    mapAction: tool({
      description:
        "Edit the route already on the map. clear removes the stops and the line. undo and redo step through edits. reverse flips the stop order. closeLoop joins the end back to the start. Never use this to draw a new loop.",
      inputSchema: z.object({
        action: z.enum(mapActions),
      }),
      execute: async ({ action }) => ({ action, applied: true }),
    }),
    planRun: tool({
      description:
        "Build a loop running route and put it on the map. Use for around-me, time, distance, parks, lakes, water, or named places.",
      inputSchema: planRunInputSchema,
      execute: async (input) =>
        executePlanRun(input, context, {
          deps: { searchPlaces, findScenicPlaces },
          userText,
        }),
    }),
  };
}

export function chatInstructions(basePrompt: string, context?: AgentChatContext) {
  if (!context) return basePrompt;
  const gps = context.location
    ? `${context.location.lat.toFixed(5)}, ${context.location.lng.toFixed(5)}`
    : "unknown";
  const center = context.mapCenter
    ? `${context.mapCenter.lat.toFixed(5)}, ${context.mapCenter.lng.toFixed(5)}`
    : "unknown";
  return [
    basePrompt,
    "",
    "Live planner context:",
    `GPS: ${gps}`,
    `Map center: ${center}`,
    `Units: ${context.unit ?? "metric"}`,
    `Pace: ${context.paceSecondsPerKm ?? DEFAULT_PACE_SECONDS_PER_KM} seconds per km`,
  ].join("\n");
}
