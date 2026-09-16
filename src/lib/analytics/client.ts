"use client";

import posthog from "posthog-js";
import type { AnalyticsEvent } from "@/lib/analytics/events";

export function captureEvent(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function analyticsHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    const distinctId = posthog.get_distinct_id();
    const sessionId = posthog.get_session_id();
    return {
      ...(distinctId ? { "X-POSTHOG-DISTINCT-ID": distinctId } : {}),
      ...(sessionId ? { "X-POSTHOG-SESSION-ID": sessionId } : {}),
    };
  } catch {
    return {};
  }
}
