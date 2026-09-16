import { createShareSlug, sharePathForSlug } from "@/lib/routes/slug";
import type { GeoPoint } from "@/lib/schemas/features";
import type { RouteMetrics, RouteMode, RouteResponse } from "@/lib/schemas/route";
import {
  type SavedRoute,
  type SavedRouteSummary,
  type SaveRouteRequest,
  savedRouteSchema,
  savedRouteSummarySchema,
} from "@/lib/schemas/saved-route";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type SavedRouteRow = {
  id: string;
  owner_clerk_id: string;
  name: string;
  share_slug: string;
  points: GeoPoint[];
  known_labels: Record<string, string>;
  mode: RouteMode;
  coordinates: [number, number][];
  metrics: RouteMetrics;
  provider: RouteResponse["provider"];
  warnings: string[];
  created_at: string;
  updated_at: string;
};

function toSummary(row: SavedRouteRow): SavedRouteSummary {
  return savedRouteSummarySchema.parse({
    id: row.id,
    name: row.name,
    shareSlug: row.share_slug,
    sharePath: sharePathForSlug(row.share_slug),
    mode: row.mode,
    distanceMeters: row.metrics.distanceMeters,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toSavedRoute(row: SavedRouteRow): SavedRoute {
  return savedRouteSchema.parse({
    ...toSummary(row),
    points: row.points,
    knownLabels: row.known_labels ?? {},
    route: {
      coordinates: row.coordinates,
      metrics: row.metrics,
      provider: row.provider,
      warnings: row.warnings ?? [],
    },
  });
}

export async function listSavedRoutes(ownerClerkId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("saved_routes")
    .select(
      "id, owner_clerk_id, name, share_slug, points, known_labels, mode, coordinates, metrics, provider, warnings, created_at, updated_at",
    )
    .eq("owner_clerk_id", ownerClerkId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as SavedRouteRow[]).map(toSummary);
}

export async function getOwnedSavedRoute(ownerClerkId: string, id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("saved_routes")
    .select(
      "id, owner_clerk_id, name, share_slug, points, known_labels, mode, coordinates, metrics, provider, warnings, created_at, updated_at",
    )
    .eq("owner_clerk_id", ownerClerkId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toSavedRoute(data as SavedRouteRow) : null;
}

export async function getSavedRouteBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("saved_routes")
    .select(
      "id, owner_clerk_id, name, share_slug, points, known_labels, mode, coordinates, metrics, provider, warnings, created_at, updated_at",
    )
    .eq("share_slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? toSavedRoute(data as SavedRouteRow) : null;
}

export async function createSavedRoute(ownerClerkId: string, input: SaveRouteRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  let lastError: { code?: string; message?: string } | undefined;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from("saved_routes")
      .insert({
        owner_clerk_id: ownerClerkId,
        name: input.name,
        share_slug: createShareSlug(),
        points: input.points,
        known_labels: input.knownLabels,
        mode: input.mode,
        coordinates: input.route.coordinates,
        metrics: input.route.metrics,
        provider: input.route.provider,
        warnings: input.route.warnings,
      })
      .select(
        "id, owner_clerk_id, name, share_slug, points, known_labels, mode, coordinates, metrics, provider, warnings, created_at, updated_at",
      )
      .single();

    if (!error) return toSavedRoute(data as SavedRouteRow);
    lastError = error;
    if (error.code !== "23505") throw error;
  }

  throw lastError ?? new Error("Could not create a unique share link");
}

export async function renameSavedRoute(ownerClerkId: string, id: string, name: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("saved_routes")
    .update({ name })
    .eq("owner_clerk_id", ownerClerkId)
    .eq("id", id)
    .select(
      "id, owner_clerk_id, name, share_slug, points, known_labels, mode, coordinates, metrics, provider, warnings, created_at, updated_at",
    )
    .maybeSingle();

  if (error) throw error;
  return data ? toSavedRoute(data as SavedRouteRow) : null;
}

export async function deleteSavedRoute(ownerClerkId: string, id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("saved_routes")
    .delete()
    .eq("owner_clerk_id", ownerClerkId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
