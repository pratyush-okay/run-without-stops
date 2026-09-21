"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PACE_SECONDS_PER_KM,
  displayPaceSeconds,
  durationFromPace,
  type MetricUnit,
  paceFromDuration,
  storePaceSeconds,
} from "@/lib/routing/format";

export function useRunEffort(distanceMeters: number | undefined, savedPaceSecondsPerKm?: number) {
  const [secondsPerKm, setSecondsPerKm] = useState(
    savedPaceSecondsPerKm ?? DEFAULT_PACE_SECONDS_PER_KM,
  );
  const appliedPace = useRef(savedPaceSecondsPerKm);

  useEffect(() => {
    if (savedPaceSecondsPerKm === undefined || appliedPace.current === savedPaceSecondsPerKm) {
      return;
    }
    appliedPace.current = savedPaceSecondsPerKm;
    setSecondsPerKm(savedPaceSecondsPerKm);
  }, [savedPaceSecondsPerKm]);

  const durationSeconds = useMemo(
    () => (distanceMeters ? durationFromPace(distanceMeters, secondsPerKm) : undefined),
    [distanceMeters, secondsPerKm],
  );

  function nudgePace(deltaDisplayedSeconds: number, unit: MetricUnit) {
    setSecondsPerKm((current) =>
      storePaceSeconds(displayPaceSeconds(current, unit) + deltaDisplayedSeconds, unit),
    );
  }

  function nudgeTime(deltaSeconds: number) {
    if (!distanceMeters || !durationSeconds) return;
    setSecondsPerKm(paceFromDuration(distanceMeters, durationSeconds + deltaSeconds));
  }

  return { secondsPerKm, durationSeconds, nudgePace, nudgeTime };
}
