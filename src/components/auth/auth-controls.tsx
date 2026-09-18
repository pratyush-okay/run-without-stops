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

function SavedRoutesIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        d="M5 2.6h6v10.6L8 11.2 5 13.2V2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        d="M6.2 3.2H3.8A1.2 1.2 0 0 0 2.6 4.4v7.2a1.2 1.2 0 0 0 1.2 1.2h2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.8 8h6.4M10.6 5.4 13.4 8l-2.8 2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const menuItemClass =
  "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-xs transition";

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
          className={`rws-panel absolute right-0 z-30 w-52 overflow-hidden p-1.5 ${
            menuPlacement === "down" ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#c8ff52]/10 font-mono text-[11px] font-semibold text-[#c8ff52]">
              {initial}
            </span>
            <p className="min-w-0 truncate text-xs font-medium text-white/85">{username}</p>
          </div>
          <div className="mx-1 my-1 h-px bg-white/8" />
          {onOpenSavedRoutes ? (
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-white/80 hover:bg-white/[0.06] hover:text-white`}
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSavedRoutes();
              }}
            >
              <SavedRoutesIcon />
              Saved routes
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} text-[#ff6b6b] hover:bg-[#ff6b6b]/10 hover:text-[#ff8b8b]`}
            onClick={() => {
              setIsMenuOpen(false);
              void signOut({ redirectUrl: "/" });
            }}
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
