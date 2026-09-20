import {
  decideSsoCallback,
  nextAfterSignInTransfer,
  nextAfterSignUpTransfer,
} from "@/lib/auth/sso-callback-decision";

const idle = {
  clerkLoaded: true,
  isSignedIn: false,
  signInTransferable: false,
  signUpTransferable: false,
};

describe("decideSsoCallback", () => {
  it("waits until Clerk has loaded", () => {
    expect(decideSsoCallback({ ...idle, clerkLoaded: false })).toEqual({ type: "wait" });
  });

  it("sends an already-signed-in user home so Connecting cannot stick after a session exists", () => {
    expect(
      decideSsoCallback({ ...idle, isSignedIn: true, signInStatus: "needs_first_factor" }),
    ).toEqual({ type: "go-home" });
  });

  it("finalizes a completed sign-in", () => {
    expect(decideSsoCallback({ ...idle, signInStatus: "complete" })).toEqual({
      type: "finalize-sign-in",
    });
  });

  it("transfers a Google sign-up onto an existing account", () => {
    expect(decideSsoCallback({ ...idle, signUpTransferable: true })).toEqual({
      type: "transfer-to-sign-in",
    });
  });

  it("transfers a first-time Google sign-in onto sign-up before treating it as a normal first factor", () => {
    expect(
      decideSsoCallback({
        ...idle,
        signInStatus: "needs_first_factor",
        signInTransferable: true,
        signInFirstFactors: [{ strategy: "oauth_google" }],
      }),
    ).toEqual({ type: "transfer-to-sign-up" });
  });

  it("sends incomplete Google sign-ups to the continue page", () => {
    expect(decideSsoCallback({ ...idle, signUpStatus: "missing_requirements" })).toEqual({
      type: "continue-sign-up",
    });
  });

  it("activates an existing session on this client", () => {
    expect(
      decideSsoCallback({
        ...idle,
        signInExistingSessionId: "sess_123",
      }),
    ).toEqual({ type: "activate-session", sessionId: "sess_123" });
  });

  it("waits while OAuth status is still hydrating", () => {
    expect(decideSsoCallback(idle)).toEqual({ type: "wait" });
  });
});

describe("transfer follow-up", () => {
  it("finalizes a completed sign-up transfer even when Clerk only sets createdSessionId", () => {
    expect(nextAfterSignUpTransfer("missing_requirements", "sess_1")).toBe("finalize-sign-up");
    expect(nextAfterSignUpTransfer("complete")).toBe("finalize-sign-up");
    expect(nextAfterSignUpTransfer("missing_requirements")).toBe("continue-sign-up");
  });

  it("sends a failed sign-in transfer home", () => {
    expect(nextAfterSignInTransfer("needs_first_factor")).toBe("go-home");
    expect(nextAfterSignInTransfer("complete")).toBe("finalize-sign-in");
  });
});
