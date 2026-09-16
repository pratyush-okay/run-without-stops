const DISTINCT_ID_HEADER = "x-posthog-distinct-id";
const SESSION_ID_HEADER = "x-posthog-session-id";

export function distinctIdFromRequest(request: Request, userId?: string) {
  return userId ?? request.headers.get(DISTINCT_ID_HEADER) ?? undefined;
}

export function sessionIdFromRequest(request: Request) {
  return request.headers.get(SESSION_ID_HEADER) ?? undefined;
}
