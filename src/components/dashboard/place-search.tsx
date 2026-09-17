"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LocationGlyph, SearchGlyph } from "@/components/dashboard/panel-marks";
import { analyticsHeaders, captureEvent } from "@/lib/analytics/client";
import { analyticsEvents } from "@/lib/analytics/events";
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
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [locationError, setLocationError] = useState<string>();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          headers: analyticsHeaders(),
        });
        if (!response.ok) throw new Error("Search failed");
        const payload = searchResponseSchema.parse(await response.json());
        setResults(payload.results);
        setIsOpen(true);
        captureEvent(analyticsEvents.placeSearched, {
          query_length: trimmed.length,
          result_count: payload.results.length,
        });
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setMobileExpanded(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setMobileExpanded(false);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileExpanded(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function selectResult(result: SearchResult) {
    setQuery(result.label.split(",")[0] ?? result.label);
    setIsOpen(false);
    setMobileExpanded(false);
    setLocationError(undefined);
    onSelect(result.point, shortPlaceLabel(result.label));
  }

  function expandSearch() {
    setMobileExpanded(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
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

  const fieldClass = mobileExpanded ? "block" : "hidden md:block";
  const goClass = mobileExpanded ? "inline-flex" : "hidden md:inline-flex";
  const compact = !mobileExpanded;

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-max" : "min-w-0 w-full"} md:w-full`}>
      <form
        className={`rws-search h-10 items-center ${compact ? "w-max md:w-full" : "w-full"}`}
        onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) selectResult(results[0]);
        }}
      >
        <button
          type="button"
          className="grid h-full w-10 shrink-0 place-items-center text-[#c8ff52] transition hover:bg-white/[0.05] disabled:opacity-50"
          onClick={locateMe}
          disabled={isLocating}
          aria-label="Use my location"
        >
          {isLocating ? (
            <span className="font-mono text-[10px]" aria-hidden>
              …
            </span>
          ) : (
            <LocationGlyph className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          className={`h-full w-10 shrink-0 place-items-center text-[#c8ff52] transition hover:bg-white/[0.05] ${
            compact ? "grid md:hidden" : "hidden"
          }`}
          onClick={expandSearch}
          aria-label="Search Sydney"
          aria-expanded={mobileExpanded}
          aria-controls={listId}
        >
          <SearchGlyph className="size-3.5" />
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => (results.length > 0 || isSearching) && setIsOpen(true)}
          placeholder="Search"
          aria-label="Search Sydney"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={isOpen}
          role="combobox"
          className={`min-w-0 flex-1 bg-transparent py-0 pr-1 text-sm text-white outline-none placeholder:text-white/35 ${fieldClass}`}
        />
        <kbd
          className="mr-1.5 hidden h-5 shrink-0 items-center justify-center rounded-md border border-white/15 px-1.5 font-sans text-[11px] font-normal leading-none text-white/40 md:inline-flex"
          aria-hidden
        >
          ⌘K
        </kbd>
        <button
          type="submit"
          className={`h-full shrink-0 items-center px-2.5 text-[10px] font-semibold tracking-wider whitespace-nowrap text-[#c8ff52] uppercase transition hover:bg-white/[0.05] disabled:opacity-40 ${goClass}`}
          disabled={isSearching || query.trim().length < 2}
        >
          {isSearching ? "…" : "Go run"}
        </button>
      </form>
      {isOpen ? (
        <div
          id={listId}
          role="listbox"
          className={`rws-panel absolute top-[calc(100%+0.5rem)] right-0 left-0 z-30 max-h-[min(16rem,calc(100dvh-8rem))] overflow-y-auto p-1 ${
            mobileExpanded ? "block" : "hidden md:block"
          }`}
        >
          {isSearching && results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-white/45">Searching Sydney…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-white/45">No Sydney places found.</p>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                role="option"
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
        <p className="absolute top-[calc(100%+0.4rem)] right-0 left-0 min-w-40 rounded-xl border border-[#ffad91]/20 bg-[#261712]/90 px-3 py-2 text-[11px] text-[#ffad91] backdrop-blur">
          {locationError}
        </p>
      ) : null}
    </div>
  );
}
