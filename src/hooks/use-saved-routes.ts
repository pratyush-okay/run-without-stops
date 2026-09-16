"use client";

import { useCallback, useEffect, useState } from "react";
import { analyticsHeaders } from "@/lib/analytics/client";
import {
  type SavedRoute,
  type SavedRouteSummary,
  savedRouteListResponseSchema,
  savedRouteSchema,
} from "@/lib/schemas/saved-route";

async function readError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function useSavedRoutes(enabled: boolean) {
  const [routes, setRoutes] = useState<SavedRouteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!enabled) {
      setRoutes([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/routes", { headers: analyticsHeaders() });
      if (!response.ok)
        throw new Error(await readError(response, "Saved routes could not be loaded"));
      const payload = savedRouteListResponseSchema.parse(await response.json());
      setRoutes(payload.routes);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saved routes could not be loaded");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const load = useCallback(async (id: string): Promise<SavedRoute> => {
    const response = await fetch(`/api/routes/${id}`, { headers: analyticsHeaders() });
    if (!response.ok) throw new Error(await readError(response, "Route could not be loaded"));
    return savedRouteSchema.parse(await response.json());
  }, []);

  const save = useCallback(
    async (input: {
      name: string;
      points: SavedRoute["points"];
      knownLabels: SavedRoute["knownLabels"];
      mode: SavedRoute["mode"];
      route: SavedRoute["route"];
    }) => {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...analyticsHeaders() },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error(await readError(response, "Route could not be saved"));
      const saved = savedRouteSchema.parse(await response.json());
      setRoutes((current) => [saved, ...current.filter((route) => route.id !== saved.id)]);
      return saved;
    },
    [],
  );

  const rename = useCallback(async (id: string, name: string) => {
    const response = await fetch(`/api/routes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...analyticsHeaders() },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(await readError(response, "Route could not be renamed"));
    const saved = savedRouteSchema.parse(await response.json());
    setRoutes((current) => current.map((route) => (route.id === id ? saved : route)));
    return saved;
  }, []);

  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/routes/${id}`, {
      method: "DELETE",
      headers: analyticsHeaders(),
    });
    if (!response.ok) throw new Error(await readError(response, "Route could not be deleted"));
    setRoutes((current) => current.filter((route) => route.id !== id));
  }, []);

  return { routes, isLoading, error, refresh, load, save, rename, remove };
}
