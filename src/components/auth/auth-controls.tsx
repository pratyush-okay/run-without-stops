"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";

function AccountIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
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
};

export function AuthControls({ menuPlacement = "up" }: AuthControlsProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isSignedIn) setIsModalOpen(false);
  }, [isSignedIn]);

  if (!isLoaded) {
    return (
      <div
        className="size-10 rounded-full border border-white/8 bg-[#101512]/70 md:size-8"
        aria-hidden
      />
    );
  }

  if (!isSignedIn || !user) {
    return (
      <>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-white/8 bg-[#101512]/70 text-white/40 backdrop-blur-xl transition hover:border-white/16 hover:text-white/80 md:size-8"
          onClick={() => setIsModalOpen(true)}
          aria-label="Sign in"
          title="Sign in"
        >
          <AccountIcon />
        </button>
        {isModalOpen ? <AuthModal onClose={() => setIsModalOpen(false)} /> : null}
      </>
    );
  }

  const username =
    user.username ??
    (typeof user.unsafeMetadata.username === "string" ? user.unsafeMetadata.username : undefined) ??
    user.primaryEmailAddress?.emailAddress ??
    "Runner";
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full border border-white/8 bg-[#c8ff52] text-[10px] font-black text-[#101512] shadow-sm md:size-8"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={`Account, ${username}`}
        title={username}
      >
        {initial}
      </button>
      {isMenuOpen ? (
        <div
          role="menu"
          className={`rws-panel absolute right-0 w-44 overflow-hidden p-1.5 ${
            menuPlacement === "down" ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <p className="truncate px-2.5 py-2 text-[11px] text-white/45">
            {user.primaryEmailAddress?.emailAddress ?? username}
          </p>
          <button
            type="button"
            role="menuitem"
            className="rws-button w-full text-left"
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
