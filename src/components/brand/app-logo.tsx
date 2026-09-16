export function AppLogo({ className = "size-10" }: { className?: string }) {
  return (
    <a
      href="/"
      className={`grid shrink-0 place-items-center ${className}`}
      aria-label="Run Without Stops"
    >
      <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
        <circle cx="16" cy="16" r="15.15" fill="#101512" stroke="#c8ff52" strokeWidth="1.4" />
        <path
          d="M9 17.1c.35-4.35 3.4-7.25 7.45-7.25 4.55 0 7.55 3.05 7.55 7.55 0 4.55-3.2 7.7-7.85 7.7-2.45 0-4.55-.85-6-2.35"
          fill="none"
          stroke="#c8ff52"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="9.15" cy="17.2" r="1.65" fill="#c8ff52" />
      </svg>
      <span className="sr-only">Run Without Stops</span>
    </a>
  );
}
