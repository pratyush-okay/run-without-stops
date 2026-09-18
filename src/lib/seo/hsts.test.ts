import { applyHsts, HSTS_HEADER } from "@/lib/seo/hsts";

describe("applyHsts", () => {
  it("pins HTTPS on apex redirects that only had a short HSTS value", () => {
    const headers = new Headers({
      "Strict-Transport-Security": "max-age=63072000",
    });
    applyHsts(headers);
    expect(headers.get("Strict-Transport-Security")).toBe(HSTS_HEADER);
  });
});
