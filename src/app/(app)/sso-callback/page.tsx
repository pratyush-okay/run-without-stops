"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppLogo } from "@/components/brand/app-logo";
import { SSO_CONTINUE_PATH } from "@/lib/auth/oauth";
import { navigateAfterSso } from "@/lib/auth/sso-navigation";

export default function SsoCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    void (async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      const finalizeSignIn = async () => {
        await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            navigateAfterSso({ session, decorateUrl, router });
          },
        });
      };

      const finalizeSignUp = async () => {
        await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            navigateAfterSso({ session, decorateUrl, router });
          },
        });
      };

      if (signIn.status === "complete") {
        await finalizeSignIn();
        return;
      }

      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        if (signIn.createdSessionId) {
          await finalizeSignIn();
          return;
        }
        router.push("/");
        return;
      }

      if (
        signIn.status === "needs_first_factor" &&
        !signIn.supportedFirstFactors?.every((factor) => factor.strategy === "enterprise_sso")
      ) {
        router.push("/");
        return;
      }

      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.createdSessionId) {
          await finalizeSignUp();
          return;
        }
        router.push(SSO_CONTINUE_PATH);
        return;
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      if (signIn.status === "needs_second_factor" || signIn.status === "needs_new_password") {
        router.push("/");
        return;
      }

      const sessionId = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
      if (sessionId) {
        await clerk.setActive({
          session: sessionId,
          navigate: async ({ session, decorateUrl }) => {
            navigateAfterSso({ session, decorateUrl, router });
          },
        });
      }
    })();
  }, [clerk, router, signIn, signUp]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-4 text-white">
      <section className="rws-panel w-full max-w-md p-5">
        <AppLogo className="mb-3 size-10" />
        <p className="rws-kicker">Account</p>
        <h1 className="text-lg font-semibold tracking-tight">Connecting your account</h1>
        <p className="mt-2 text-xs text-white/55">Finishing sign in with Google.</p>
        <div id="clerk-captcha" className="mt-4" />
      </section>
    </main>
  );
}
