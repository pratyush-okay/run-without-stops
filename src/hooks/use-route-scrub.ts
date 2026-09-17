"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RouteScrub } from "@/lib/routing/route-scrub";

export function useRouteScrub(routeKey: string | undefined) {
  const [scrub, setScrub] = useState<RouteScrub>();
  const frameRef = useRef<number>(0);
  const clearRef = useRef<number>(0);

  const updateScrub = useCallback((next: RouteScrub | undefined) => {
    window.clearTimeout(clearRef.current);
    window.cancelAnimationFrame(frameRef.current);
    if (!next) {
      clearRef.current = window.setTimeout(() => setScrub(undefined), 70);
      return;
    }
    frameRef.current = window.requestAnimationFrame(() => {
      setScrub((current) => {
        if (
          current &&
          Math.abs(current.distanceMeters - next.distanceMeters) < 3 &&
          current.point.lat === next.point.lat &&
          current.point.lng === next.point.lng
        ) {
          return current;
        }
        return next;
      });
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: routeKey is the reset identity
  useEffect(() => {
    setScrub(undefined);
    return () => {
      window.clearTimeout(clearRef.current);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [routeKey]);

  return { scrub, updateScrub };
}
