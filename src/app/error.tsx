"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-6 text-white">
      <div className="max-w-sm text-center">
        <p className="text-[11px] tracking-[0.2em] text-white/35 uppercase">Run Without Stops</p>
        <h1 className="mt-3 text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/55">The map could not recover from this error.</p>
        <button
          type="button"
          className="mt-5 rounded-xl bg-[#c8ff52] px-4 py-2 text-sm font-semibold text-[#101512]"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
