"use client";

import { useClerk, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppLogo } from "@/components/brand/app-logo";
import { SSO_COMPLETE_PATH, SSO_CONTINUE_PATH } from "@/lib/auth/oauth";
import {
  decideSsoCallback,
  nextAfterSignInTransfer,
  nextAfterSignUpTransfer,
} from "@/lib/auth/sso-callback-decision";
import { navigateAfterSso } from "@/lib/auth/sso-navigation";

export default function SsoCallbackPage() {
  const clerk = useClerk();
  const { isSignedIn } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const decision = decideSsoCallback({
      clerkLoaded: clerk.loaded,
      isSignedIn: Boolean(isSignedIn),
      signInStatus: signIn.status,
      signInTransferable: signIn.isTransferable,
      signInExistingSessionId: signIn.existingSession?.sessionId,
      signInFirstFactors: signIn.supportedFirstFactors,
      signUpStatus: signUp.status,
      signUpTransferable: signUp.isTransferable,
      signUpExistingSessionId: signUp.existingSession?.sessionId,
    });

    if (isSignedIn) {
      window.location.assign(SSO_COMPLETE_PATH);
      return;
    }
    if (decision.type === "wait") return;
    if (hasRun.current) return;
    hasRun.current = true;

    const goHome = (args: {
      session?: Parameters<typeof navigateAfterSso>[0]["session"];
      decorateUrl: (url: string) => string;
    }) => {
      navigateAfterSso(args);
    };

    void (async () => {
      if (decision.type === "go-home") {
        window.location.assign(SSO_COMPLETE_PATH);
        return;
      }

      if (decision.type === "continue-sign-up") {
        router.push(SSO_CONTINUE_PATH);
        return;
      }

      if (decision.type === "finalize-sign-in") {
        await signIn.finalize({ navigate: goHome });
        return;
      }

      if (decision.type === "finalize-sign-up") {
        await signUp.finalize({ navigate: goHome });
        return;
      }

      if (decision.type === "transfer-to-sign-in") {
        await signIn.create({ transfer: true });
        if (
          nextAfterSignInTransfer(signIn.status, signIn.createdSessionId) === "finalize-sign-in"
        ) {
          await signIn.finalize({ navigate: goHome });
          return;
        }
        window.location.assign(SSO_COMPLETE_PATH);
        return;
      }

      if (decision.type === "transfer-to-sign-up") {
        await signUp.create({ transfer: true });
        if (
          nextAfterSignUpTransfer(signUp.status, signUp.createdSessionId) === "finalize-sign-up"
        ) {
          await signUp.finalize({ navigate: goHome });
          return;
        }
        router.push(SSO_CONTINUE_PATH);
        return;
      }

      await clerk.setActive({
        session: decision.sessionId,
        navigate: goHome,
      });
    })();
  }, [clerk, isSignedIn, router, signIn, signUp]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-4 text-white">
      <section className="rws-panel w-full max-w-md p-5">
        <AppLogo className="mb-3 size-10" />
        <p className="rws-kicker">Account</p>
        <h1 className="text-lg font-semibold tracking-tight">Connecting your account</h1>
        <p className="mt-2 text-xs text-white/55">Finishing sign in with Google.</p>
        <div id="clerk-captcha" className="mt-4" />
        {slow ? (
          <p className="mt-4 text-xs text-white/55">
            This is taking longer than usual.{" "}
            <Link
              className="text-white/80 underline-offset-2 hover:underline"
              href={SSO_COMPLETE_PATH}
            >
              Open the map
            </Link>
            .
          </p>
        ) : null}
      </section>
    </main>
  );
}
