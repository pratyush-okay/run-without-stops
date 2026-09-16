import { PostHog } from "posthog-node";
import { env } from "@/env";
import type { AnalyticsEvent } from "@/lib/analytics/events";
import { distinctIdFromRequest, sessionIdFromRequest } from "@/lib/analytics/request";
import { reportError } from "@/lib/observability/report-error";

let posthogClient: PostHog | null | undefined;

function getPostHogClient() {
  if (posthogClient !== undefined) return posthogClient;
  const token = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) {
    posthogClient = null;
    return posthogClient;
  }

  posthogClient = new PostHog(token, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}

export async function captureServerEvent({
  distinctId,
  event,
  properties,
}: {
  distinctId?: string;
  event: AnalyticsEvent;
  properties?: Record<string, unknown>;
}) {
  if (!distinctId) return;
  const client = getPostHogClient();
  if (!client) return;

  try {
    client.capture({
      distinctId,
      event,
      ...(properties ? { properties } : {}),
    });
    await client.flush();
  } catch (error) {
    reportError(error, { source: "posthog" });
  }
}

export async function captureRequestEvent(
  request: Request,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
  userId?: string,
) {
  const distinctId = distinctIdFromRequest(request, userId);
  if (!distinctId) return;
  const sessionId = sessionIdFromRequest(request);
  await captureServerEvent({
    distinctId,
    event,
    properties: {
      ...properties,
      ...(sessionId ? { $session_id: sessionId } : {}),
    },
  });
}
