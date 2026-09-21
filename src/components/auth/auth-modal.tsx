"use client";

import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/nextjs/types";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AppLogo } from "@/components/brand/app-logo";
import { SSO_CALLBACK_PATH, SSO_COMPLETE_PATH, ssoErrorMessage } from "@/lib/auth/oauth";
import { usernameSchema } from "@/lib/schemas/profile";

type AuthMode = "sign-in" | "sign-up";
export type AuthIntent = "save" | "share" | "style" | "chat";

type AuthModalProps = {
  onClose: () => void;
};

function fieldError(error: { message?: string } | null | undefined) {
  return error?.message;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const titleId = useId();
  const { isSignedIn } = useUser();
  const { signIn, errors: signInErrors, fetchStatus: signInStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpStatus } = useSignUp();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string>();

  const isSignUpVerifying =
    mode === "sign-up" &&
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address");
  const isSignInVerifying =
    mode === "sign-in" &&
    (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor");
  const isVerifying = isSignUpVerifying || isSignInVerifying;
  const isBusy = signInStatus === "fetching" || signUpStatus === "fetching";

  useEffect(() => {
    if (isSignedIn) onClose();
  }, [isSignedIn, onClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function startSso(strategy: OAuthStrategy) {
    setFormError(undefined);
    const flow = mode === "sign-up" ? signUp : signIn;
    const { error } = await flow.sso({
      strategy,
      redirectUrl: SSO_COMPLETE_PATH,
      redirectCallbackUrl: SSO_CALLBACK_PATH,
    });
    if (error) setFormError(ssoErrorMessage(error.message));
  }

  async function submitSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const { error } = await signIn.password({ identifier: email, password });
    if (error) {
      setFormError(error.message);
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: async () => undefined });
      return;
    }
    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const { error: verificationError } = await signIn.mfa.sendEmailCode();
      if (verificationError) setFormError(verificationError.message);
    }
  }

  async function submitSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      setFormError(parsedUsername.error.issues[0]?.message ?? "Choose a username");
      return;
    }

    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      setFormError(error.message);
      return;
    }

    await signUp.update({ unsafeMetadata: { username: parsedUsername.data } });
    await signUp.verifications.sendEmailCode();
  }

  async function submitVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const { error } = isSignInVerifying
      ? await signIn.mfa.verifyEmailCode({ code })
      : await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setFormError(error.message);
      return;
    }
    if (mode === "sign-in") {
      if (signIn.status === "complete") {
        await signIn.finalize({ navigate: async () => undefined });
      }
    } else if (signUp.status === "complete") {
      await signUp.finalize({ navigate: async () => undefined });
    }
  }

  async function resendVerificationCode() {
    setFormError(undefined);
    const { error } = isSignInVerifying
      ? await signIn.mfa.sendEmailCode()
      : await signUp.verifications.sendEmailCode();
    if (error) setFormError(error.message);
  }

  const activeError =
    formError ??
    fieldError(
      mode === "sign-in" ? signInErrors.fields.identifier : signUpErrors.fields.emailAddress,
    ) ??
    fieldError(mode === "sign-in" ? signInErrors.fields.password : signUpErrors.fields.password) ??
    fieldError(signUpErrors.fields.username) ??
    fieldError(signUpErrors.fields.code) ??
    signInErrors.global?.[0]?.message ??
    signUpErrors.global?.[0]?.message;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#050806]/72 px-0 backdrop-blur-sm md:items-center md:px-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rws-panel rws-sheet relative z-10 max-h-[min(36rem,calc(100dvh-env(safe-area-inset-top)-1rem))] w-full max-w-none shrink-0 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-w-md md:pb-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <AppLogo className="mb-3 size-10" />
            <p className="rws-kicker">Account</p>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {isVerifying ? "Check your email" : mode === "sign-in" ? "Sign in" : "Create account"}
            </h2>
            {isVerifying ? null : (
              <p className="mt-1 max-w-[16rem] text-xs leading-5 text-white/55">
                {mode === "sign-up"
                  ? "Pick a username and confirm your email. An account keeps named routes, share links, and map looks."
                  : "Your named routes, share links, and map looks stay on this account."}
              </p>
            )}
          </div>
          <button type="button" className="rws-button px-2.5" onClick={onClose}>
            Close
          </button>
        </div>

        {isVerifying ? (
          <form className="grid gap-3" onSubmit={submitVerification}>
            <p className="text-xs text-white/55">
              Enter the code sent to {email || "your email"} to finish creating your account.
            </p>
            <label className="grid gap-1.5 text-[11px] text-white/45">
              Verification code
              <input
                className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none ring-[#c8ff52]/0 transition focus:border-[#c8ff52]/40 focus:ring-4"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>
            {activeError ? <p className="text-xs text-[#ffad91]">{activeError}</p> : null}
            <button
              type="submit"
              className="rws-button bg-[#c8ff52] text-[#101512] hover:bg-[#d6ff7a]"
              disabled={isBusy}
            >
              {isBusy ? "Verifying..." : "Verify and continue"}
            </button>
            <button
              type="button"
              className="text-xs text-white/45 underline-offset-2 hover:text-white hover:underline"
              onClick={() => void resendVerificationCode()}
            >
              Send a new code
            </button>
          </form>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/4 p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  mode === "sign-in" ? "bg-white/10 text-white" : "text-white/45"
                }`}
                onClick={() => {
                  setMode("sign-in");
                  setFormError(undefined);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  mode === "sign-up" ? "bg-white/10 text-white" : "text-white/45"
                }`}
                onClick={() => {
                  setMode("sign-up");
                  setFormError(undefined);
                }}
              >
                Sign up
              </button>
            </div>

            <SocialAuthButtons disabled={isBusy} onSelect={(strategy) => void startSso(strategy)} />
            <div className="my-4 flex items-center gap-3 text-[11px] text-white/35">
              <span className="h-px flex-1 bg-white/10" />
              or use email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form
              className="grid gap-3"
              onSubmit={mode === "sign-in" ? submitSignIn : submitSignUp}
            >
              {mode === "sign-up" ? (
                <label className="grid gap-1.5 text-[11px] text-white/45">
                  Username
                  <input
                    className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none transition focus:border-[#c8ff52]/40 focus:ring-4 focus:ring-[#c8ff52]/10"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="night_runner"
                    required
                  />
                </label>
              ) : null}
              <label className="grid gap-1.5 text-[11px] text-white/45">
                Email
                <input
                  className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none transition focus:border-[#c8ff52]/40 focus:ring-4 focus:ring-[#c8ff52]/10"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-[11px] text-white/45">
                Password
                <input
                  className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none transition focus:border-[#c8ff52]/40 focus:ring-4 focus:ring-[#c8ff52]/10"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {mode === "sign-up" ? <div id="clerk-captcha" /> : null}
              {activeError ? <p className="text-xs text-[#ffad91]">{activeError}</p> : null}
              <button
                type="submit"
                className="rws-button bg-[#c8ff52] text-[#101512] hover:bg-[#d6ff7a]"
                disabled={isBusy}
              >
                {isBusy ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>
            <p className="mt-4 text-[11px] leading-5 text-white/35">
              Planning and GPX, SVG, or image export stay available without an account.{" "}
              {mode === "sign-up"
                ? "Creating an account means you agree to the "
                : "By signing in you agree to the "}
              <Link
                className="text-white/70 underline-offset-2 hover:text-white hover:underline"
                href="/terms"
              >
                terms
              </Link>
              .
            </p>
          </>
        )}
      </section>
    </div>
  );
}
