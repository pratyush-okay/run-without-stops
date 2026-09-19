"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLogo } from "@/components/brand/app-logo";
import { SSO_COMPLETE_PATH } from "@/lib/auth/oauth";
import { navigateAfterSso } from "@/lib/auth/sso-navigation";
import { usernameSchema } from "@/lib/schemas/profile";

export default function SsoContinuePage() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formError, setFormError] = useState<string>();

  const missing = signUp.missingFields;
  const needsUsername = missing.includes("username");
  const needsFirstName = missing.includes("first_name");
  const needsLastName = missing.includes("last_name");
  const isBusy = fetchStatus === "fetching";

  useEffect(() => {
    if (signUp.status === "complete") {
      router.push(SSO_COMPLETE_PATH);
    }
  }, [router, signUp.status]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    let parsedUsername: string | undefined;
    if (needsUsername) {
      const parsed = usernameSchema.safeParse(username);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Choose a username");
        return;
      }
      parsedUsername = parsed.data;
    }

    await signUp.update({
      ...(needsFirstName ? { firstName } : {}),
      ...(needsLastName ? { lastName } : {}),
      ...(parsedUsername
        ? { username: parsedUsername, unsafeMetadata: { username: parsedUsername } }
        : {}),
    });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: async ({ session, decorateUrl }) => {
          navigateAfterSso({ session, decorateUrl, router });
        },
      });
    }
  }

  const error =
    formError ??
    errors.fields.username?.message ??
    errors.fields.firstName?.message ??
    errors.fields.lastName?.message ??
    errors.global?.[0]?.message;

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-4 text-white">
      <section className="rws-panel w-full max-w-md p-5">
        <AppLogo className="mb-3 size-10" />
        <p className="rws-kicker">Account</p>
        <h1 className="text-lg font-semibold tracking-tight">Finish creating your account</h1>
        <p className="mt-2 text-xs text-white/55">
          Google signed you in. Add the last details so we can save your routes.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          {needsUsername ? (
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
          {needsFirstName ? (
            <label className="grid gap-1.5 text-[11px] text-white/45">
              First name
              <input
                className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none transition focus:border-[#c8ff52]/40 focus:ring-4 focus:ring-[#c8ff52]/10"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>
          ) : null}
          {needsLastName ? (
            <label className="grid gap-1.5 text-[11px] text-white/45">
              Last name
              <input
                className="h-11 rounded-xl border border-white/10 bg-[#0a0d0b] px-3 text-sm text-white outline-none transition focus:border-[#c8ff52]/40 focus:ring-4 focus:ring-[#c8ff52]/10"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
          ) : null}
          {error ? <p className="text-xs text-[#ffad91]">{error}</p> : null}
          <button
            type="submit"
            className="rws-button bg-[#c8ff52] text-[#101512] hover:bg-[#d6ff7a]"
            disabled={isBusy}
          >
            {isBusy ? "Working..." : "Continue"}
          </button>
        </form>
        <div id="clerk-captcha" className="mt-4" />
        <p className="mt-4 text-[11px] leading-5 text-white/35">
          Finishing this account means you agree to the{" "}
          <Link
            className="text-white/70 underline-offset-2 hover:text-white hover:underline"
            href="/terms"
          >
            terms
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
