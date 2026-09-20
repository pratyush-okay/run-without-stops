export type SsoCallbackDecision =
  | { type: "wait" }
  | { type: "go-home" }
  | { type: "finalize-sign-in" }
  | { type: "finalize-sign-up" }
  | { type: "transfer-to-sign-in" }
  | { type: "transfer-to-sign-up" }
  | { type: "continue-sign-up" }
  | { type: "activate-session"; sessionId: string };

export type SsoCallbackState = {
  clerkLoaded: boolean;
  isSignedIn: boolean;
  signInStatus?: string | null | undefined;
  signInTransferable: boolean;
  signInExistingSessionId?: string | undefined;
  signInFirstFactors?: Array<{ strategy?: string }> | null | undefined;
  signUpStatus?: string | null | undefined;
  signUpTransferable: boolean;
  signUpExistingSessionId?: string | undefined;
};

function isEnterpriseOnlyFirstFactor(factors: Array<{ strategy?: string }> | null | undefined) {
  return Boolean(factors?.every((factor) => factor.strategy === "enterprise_sso"));
}

export function decideSsoCallback(state: SsoCallbackState): SsoCallbackDecision {
  if (!state.clerkLoaded) return { type: "wait" };
  if (state.isSignedIn) return { type: "go-home" };
  if (state.signInStatus === "complete") return { type: "finalize-sign-in" };
  if (state.signUpTransferable) return { type: "transfer-to-sign-in" };
  if (state.signInTransferable) return { type: "transfer-to-sign-up" };
  if (state.signUpStatus === "complete") return { type: "finalize-sign-up" };
  if (state.signUpStatus === "missing_requirements") return { type: "continue-sign-up" };

  const sessionId = state.signInExistingSessionId ?? state.signUpExistingSessionId;
  if (sessionId) return { type: "activate-session", sessionId };

  if (
    state.signInStatus === "needs_second_factor" ||
    state.signInStatus === "needs_new_password" ||
    state.signInStatus === "needs_client_trust"
  ) {
    return { type: "go-home" };
  }

  if (
    state.signInStatus === "needs_first_factor" &&
    !isEnterpriseOnlyFirstFactor(state.signInFirstFactors)
  ) {
    return { type: "go-home" };
  }

  return { type: "wait" };
}

export function nextAfterSignUpTransfer(status?: string | null, createdSessionId?: string | null) {
  if (status === "complete" || createdSessionId) return "finalize-sign-up" as const;
  return "continue-sign-up" as const;
}

export function nextAfterSignInTransfer(status?: string | null, createdSessionId?: string | null) {
  if (status === "complete" || createdSessionId) return "finalize-sign-in" as const;
  return "go-home" as const;
}
