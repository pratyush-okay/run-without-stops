import Link from "next/link";
import type { ReactNode } from "react";
import { AppLogo } from "@/components/brand/app-logo";

export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0a0d0b] text-[#f4f7f5]">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <AppLogo className="size-10" />
        <div>
          <p className="rws-kicker">Run Without Stops</p>
          <Link className="text-sm text-white/70 hover:text-white" href="/blog">
            Notes on quieter routes
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16">{children}</div>
    </div>
  );
}
