import { distinctIdFromRequest, sessionIdFromRequest } from "@/lib/analytics/request";

describe("analytics request headers", () => {
  it("prefers a signed-in user id", () => {
    const request = new Request("http://localhost/api/route", {
      headers: { "X-POSTHOG-DISTINCT-ID": "anon_123" },
    });

    expect(distinctIdFromRequest(request, "user_abc")).toBe("user_abc");
  });

  it("falls back to the PostHog distinct id header", () => {
    const request = new Request("http://localhost/api/route", {
      headers: { "X-POSTHOG-DISTINCT-ID": "anon_123" },
    });

    expect(distinctIdFromRequest(request)).toBe("anon_123");
  });

  it("reads the session id header", () => {
    const request = new Request("http://localhost/api/route", {
      headers: { "X-POSTHOG-SESSION-ID": "sess_123" },
    });

    expect(sessionIdFromRequest(request)).toBe("sess_123");
  });
});
