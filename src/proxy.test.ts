import { type NextFetchEvent, NextRequest, type NextResponse } from "next/server";
import { SEARCH_CRAWLER_HEADER } from "@/lib/seo/search-crawler";

const clerkState = vi.hoisted(() => ({
  calls: 0,
  injectNoindex: false,
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware:
    (
      handler: (
        auth: unknown,
        request: NextRequest,
        event: NextFetchEvent,
      ) => Promise<NextResponse> | NextResponse,
    ) =>
    async (request: NextRequest, event: NextFetchEvent) => {
      clerkState.calls += 1;
      const response = await handler({}, request, event);
      if (clerkState.injectNoindex) {
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
      }
      return response;
    },
}));

import proxy from "@/proxy";

const event = {} as NextFetchEvent;

describe("homepage proxy", () => {
  beforeEach(() => {
    clerkState.calls = 0;
    clerkState.injectNoindex = false;
  });

  it("bypasses Clerk and marks Googlebot internally", async () => {
    const request = new NextRequest("https://www.runwithoutstops.com/", {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    const response = await proxy(request, event);

    expect(clerkState.calls).toBe(0);
    expect(response.headers.get("X-Robots-Tag")).toBe("index, follow");
    expect(response.headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(response.headers.get(`x-middleware-request-${SEARCH_CRAWLER_HEADER}`)).toBe("1");
    expect(response.headers.get("Vary")).toBe("User-Agent");
  });

  it("overwrites Clerk noindex and removes a spoofed crawler marker", async () => {
    clerkState.injectNoindex = true;
    const request = new NextRequest("https://www.runwithoutstops.com/", {
      headers: {
        "user-agent": "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36",
        [SEARCH_CRAWLER_HEADER]: "1",
      },
    });

    const response = await proxy(request, event);

    expect(clerkState.calls).toBe(1);
    expect(response.headers.get("X-Robots-Tag")).toBe("index, follow");
    expect(response.headers.has(`x-middleware-request-${SEARCH_CRAWLER_HEADER}`)).toBe(false);
    expect(response.headers.get("x-middleware-override-headers")).toBe("user-agent");
  });

  it("301s the apex host to www before Clerk runs", async () => {
    const request = new NextRequest("https://runwithoutstops.com/blog?ref=1", {
      headers: {
        host: "runwithoutstops.com",
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    const response = await proxy(request, event);

    expect(clerkState.calls).toBe(0);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://www.runwithoutstops.com/blog?ref=1");
  });

  it("does not send public blog requests through Clerk", async () => {
    const request = new NextRequest("https://www.runwithoutstops.com/blog", {
      headers: {
        "user-agent": "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const response = await proxy(request, event);

    expect(clerkState.calls).toBe(0);
    expect(response.status).toBe(200);
  });
});
