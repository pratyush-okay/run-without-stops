"use client";

import { useState } from "react";
import { shortPlaceLabel } from "@/lib/maps/place-label";
import type { GeoPoint } from "@/lib/schemas/features";
import { type SearchResult, searchResponseSchema } from "@/lib/schemas/search";

type PlaceSearchProps = {
  onSelect: (point: GeoPoint, label?: string) => void;
  onLocate: (point: GeoPoint) => void;
};

function locateErrorMessage(error: GeolocationPositionError | undefined) {
  if (!navigator.geolocation) return "Location is not available in this browser";
  if (error?.code === 1) return "Allow location access to jump to you";
  if (error?.code === 3) return "Could not find your location in time";
  return "Could not find your location";
}

export function PlaceSearch({ onSelect, onLocate }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [locationError, setLocationError] = useState<string>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error("Search failed");
      const payload = searchResponseSchema.parse(await response.json());
      setResults(payload.results);
      setIsOpen(true);
    } catch {
      setResults([]);
      setIsOpen(true);
    } finally {
      setIsSearching(false);
    }
  }

  function selectResult(result: SearchResult) {
    setQuery(result.label.split(",")[0] ?? result.label);
    setIsOpen(false);
    setLocationError(undefined);
    onSelect(result.point, shortPlaceLabel(result.label));
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setLocationError(locateErrorMessage(undefined));
      return;
    }

    setIsLocating(true);
    setLocationError(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onLocate({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setIsLocating(false);
        setLocationError(locateErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 },
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <form className="rws-search" onSubmit={submit}>
        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-md text-[#c8ff52] transition hover:bg-white/8 disabled:opacity-50"
          onClick={locateMe}
          disabled={isLocating}
          aria-label="Go to my location"
          title="Go to my location"
        >
          <span className="font-mono text-sm" aria-hidden="true">
            {isLocating ? "…" : "⌖"}
          </span>
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search"
          aria-label="Search Sydney"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          type="submit"
          className="min-h-8 shrink-0 rounded-md px-2.5 text-[10px] font-semibold tracking-wider text-[#c8ff52] uppercase disabled:opacity-40"
          disabled={isSearching || query.trim().length < 2}
        >
          {isSearching ? "…" : "Go"}
        </button>
      </form>
      {isOpen ? (
        <div className="rws-panel absolute top-[calc(100%+0.5rem)] right-0 left-0 max-h-[min(16rem,calc(100dvh-8rem))] overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-white/45">No Sydney places found.</p>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="block min-h-11 w-full truncate rounded-xl px-3 py-2.5 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"
                onClick={() => selectResult(result)}
              >
                {result.label}
              </button>
            ))
          )}
        </div>
      ) : null}
      {locationError ? (
        <p className="absolute left-0 right-0 top-[calc(100%+0.4rem)] rounded-xl border border-[#ffad91]/20 bg-[#261712]/90 px-3 py-2 text-[11px] text-[#ffad91] backdrop-blur">
          {locationError}
        </p>
      ) : null}
    </div>
  );
}
