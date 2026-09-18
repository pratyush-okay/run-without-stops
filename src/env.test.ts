describe("Clerk production key validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects development Clerk keys on Vercel production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_example");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_example");
    vi.resetModules();

    await expect(import("@/env")).rejects.toThrow("Invalid environment variables");
  });
});
