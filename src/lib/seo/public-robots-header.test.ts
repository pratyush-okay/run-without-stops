import { applyHomepageIndexRobotsTag } from "@/lib/seo/public-robots-header";

describe("applyHomepageIndexRobotsTag", () => {
  it("replaces Clerk noindex on the homepage", () => {
    const headers = new Headers({ "X-Robots-Tag": "noindex, nofollow" });
    applyHomepageIndexRobotsTag("/", headers);
    expect(headers.get("X-Robots-Tag")).toBe("index, follow");
  });

  it("leaves SSO and share routes alone", () => {
    const headers = new Headers({ "X-Robots-Tag": "noindex, nofollow" });
    applyHomepageIndexRobotsTag("/sso-callback", headers);
    applyHomepageIndexRobotsTag("/r/abc", headers);
    expect(headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
});
