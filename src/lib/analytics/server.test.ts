import { analyticsEvents } from "@/lib/analytics/events";
import { reportError } from "@/lib/observability/report-error";

const capture = vi.fn();
const flush = vi.fn();

vi.mock("posthog-node", () => ({
  PostHog: class {
    capture = capture;
    flush = flush;
  },
}));

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_test",
    NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
  },
}));

vi.mock("@/lib/observability/report-error", () => ({
  reportError: vi.fn(),
}));

const { captureRequestEvent, captureServerEvent } = await import("@/lib/analytics/server");

describe("captureServerEvent", () => {
  beforeEach(() => {
    capture.mockReset();
    flush.mockReset();
    vi.mocked(reportError).mockReset();
    flush.mockResolvedValue(undefined);
  });

  it("does not throw when PostHog flush fails", async () => {
    const error = new Error("PostHog is down");
    flush.mockRejectedValue(error);

    await expect(
      captureServerEvent({
        distinctId: "user_1",
        event: analyticsEvents.routeComputed,
      }),
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalledWith(error, { source: "posthog" });
  });

  it("does not throw when PostHog capture fails", async () => {
    const error = new Error("queue full");
    capture.mockImplementation(() => {
      throw error;
    });

    await expect(
      captureServerEvent({
        distinctId: "user_1",
        event: analyticsEvents.profileSynced,
      }),
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalledWith(error, { source: "posthog" });
  });

  it("does not fail request-scoped capture when flush rejects", async () => {
    flush.mockRejectedValue(new Error("PostHog is down"));

    await expect(
      captureRequestEvent(
        new Request("http://localhost/api/route", {
          headers: { "X-POSTHOG-DISTINCT-ID": "anon_123" },
        }),
        analyticsEvents.routeComputed,
        { mode: "quiet" },
      ),
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalled();
  });
});
