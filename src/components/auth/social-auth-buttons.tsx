"use client";

import type { OAuthStrategy } from "@clerk/nextjs/types";
import { socialProviders } from "@/lib/auth/oauth";

type SocialAuthButtonsProps = {
  disabled?: boolean;
  onSelect: (strategy: OAuthStrategy) => void;
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.35l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.05v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.99A6 6 0 0 1 6.1 12c0-.69.12-1.36.31-1.99V7.43H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.57l3.36-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 2.97 14.7 2 12 2 7.94 2 4.43 4.34 3.05 7.43l3.36 2.58C7.2 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

export function SocialAuthButtons({ disabled, onSelect }: SocialAuthButtonsProps) {
  return (
    <div className="grid gap-2">
      {socialProviders.map((provider) => (
        <button
          key={provider.strategy}
          type="button"
          className="rws-button h-11 w-full text-sm text-white/80"
          disabled={disabled}
          onClick={() => onSelect(provider.strategy)}
        >
          <GoogleMark />
          {provider.label}
        </button>
      ))}
    </div>
  );
}
