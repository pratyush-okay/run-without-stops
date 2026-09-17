"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

const profileShellClass = "rws-panel p-1.5";
const profileTileClass = "grid size-11 place-items-center rounded-lg transition md:size-10";

function AccountIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle cx="8" cy="5.2" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.2 13c.5-2.4 2.3-3.6 4.8-3.6s4.3 1.2 4.8 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

type AuthControlsProps = {
  menuPlacement?: "up" | "down";
  onSignIn: () => void;
  onOpenSavedRoutes?: () => void;
};

export function AuthControls({
  menuPlacement = "up",
  onSignIn,
  onOpenSavedRoutes,
}: AuthControlsProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  if (!isLoaded) {
    return (
      <div className={profileShellClass} aria-hidden>
        <div className={`${profileTileClass} bg-white/[0.04]`} />
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className={profileShellClass}>
        <button
          type="button"
          className={`${profileTileClass} text-white/50 hover:bg-white/[0.06] hover:text-white/85`}
          onClick={onSignIn}
          aria-label="Sign in"
        >
          <AccountIcon />
        </button>
      </div>
    );
  }

  const username =
    user.username ??
    (typeof user.unsafeMetadata.username === "string" ? user.unsafeMetadata.username : undefined) ??
    user.firstName ??
    user.primaryEmailAddress?.emailAddress ??
    "Runner";
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <div className={profileShellClass}>
        <button
          type="button"
          className={`${profileTileClass} bg-[#c8ff52]/10 font-mono text-sm font-semibold text-[#c8ff52] hover:bg-[#c8ff52]/16`}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label={`Account, ${username}`}
        >
          {initial}
        </button>
      </div>
      {isMenuOpen ? (
        <div
          role="menu"
          className={`rws-panel absolute right-0 z-30 w-48 overflow-hidden p-1.5 ${
            menuPlacement === "down" ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <p className="truncate px-2.5 py-2 text-[11px] text-[#c8ff52]/80">{username}</p>
          {onOpenSavedRoutes ? (
            <button
              type="button"
              role="menuitem"
              className="rws-button w-full text-left"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSavedRoutes();
              }}
            >
              Saved routes
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="mt-1 flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
            onClick={() => {
              setIsMenuOpen(false);
              void signOut({ redirectUrl: "/" });
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
