import { helloResponseSchema } from "@/lib/schemas/hello";

describe("helloResponseSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = helloResponseSchema.parse({
      ok: true,
      message: "API is running in the same Next.js app",
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.message.length).toBeGreaterThan(0);
  });

  it("rejects invalid payloads", () => {
    expect(() =>
      helloResponseSchema.parse({
        ok: false,
        message: "nope",
      }),
    ).toThrow();
  });
});
