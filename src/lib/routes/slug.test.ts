import { createShareSlug, fileSafeName, sharePathForSlug } from "@/lib/routes/slug";

describe("share slugs", () => {
  it("creates a lowercase share slug and path", () => {
    const slug = createShareSlug();
    expect(slug).toMatch(/^[a-z0-9]{10}$/);
    expect(sharePathForSlug(slug)).toBe(`/r/${slug}`);
  });

  it("turns a route name into a file-safe slug", () => {
    expect(fileSafeName("Hyde Park loop")).toBe("hyde-park-loop");
    expect(fileSafeName("   ")).toBe("run-without-stops");
  });
});
