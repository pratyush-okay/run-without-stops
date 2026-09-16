import { SSO_CALLBACK_PATH, socialProviders, ssoErrorMessage } from "@/lib/auth/oauth";

describe("socialProviders", () => {
  it("offers Google sign-in only", () => {
    expect(socialProviders.map((provider) => provider.strategy)).toEqual(["oauth_google"]);
    expect(socialProviders[0]?.label).toBe("Continue with Google");
    expect(SSO_CALLBACK_PATH).toBe("/sso-callback");
  });

  it("rewrites Clerk strategy errors into a usable message", () => {
    expect(
      ssoErrorMessage(
        "oauth_github does not match one of the allowed values for parameter strategy",
      ),
    ).toBe("Google sign-in isn't available right now. Use email instead.");
    expect(ssoErrorMessage("Network error")).toBe("Network error");
  });
});
