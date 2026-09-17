import { readFileSync } from "node:fs";
import path from "node:path";
import { CLERK_PROXY_MATCHER, isClerkProxyPath } from "@/lib/auth/clerk-proxy-matcher";

describe("clerk proxy matcher", () => {
  it("skips the homepage, blog, and crawler files so Googlebot avoids the Clerk handshake", () => {
    expect(isClerkProxyPath("/")).toBe(false);
    expect(isClerkProxyPath("/blog")).toBe(false);
    expect(isClerkProxyPath("/blog/the-complete-guide-to-building-a-run-without-stops")).toBe(
      false,
    );
    expect(isClerkProxyPath("/sitemap.xml")).toBe(false);
    expect(isClerkProxyPath("/robots.txt")).toBe(false);
    expect(isClerkProxyPath("/llms.txt")).toBe(false);
    expect(isClerkProxyPath("/.well-known/okf/index.md")).toBe(false);
  });

  it("still runs on SSO, APIs, and share links", () => {
    expect(isClerkProxyPath("/sso-callback")).toBe(true);
    expect(isClerkProxyPath("/sso-continue")).toBe(true);
    expect(isClerkProxyPath("/api/route")).toBe(true);
    expect(isClerkProxyPath("/r/some-share")).toBe(true);
  });

  it("keeps proxy.ts matcher strings identical to the helper", () => {
    const source = readFileSync(path.join(process.cwd(), "src/proxy.ts"), "utf8");
    for (const matcher of CLERK_PROXY_MATCHER) {
      expect(source).toContain(JSON.stringify(matcher).slice(1, -1));
    }
  });
});
