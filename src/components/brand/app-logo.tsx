export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="30.44 42 291.56 266" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="44" strokeLinecap="butt" strokeLinejoin="miter">
        <path d="M218 96 L164 150 L88 150 L46 192" />
        <path d="M164 150 L224 210 L148 286 L80 286" />
        <path d="M224 210 L288 274 L322 274" />
      </g>
      <circle cx="104" cy="76" r="34" fill="currentColor" />
    </svg>
  );
}

export function AppLogo({ className = "size-10" }: { className?: string }) {
  return (
    <a
      href="/"
      className={`grid shrink-0 place-items-center text-[#A8FF35] ${className}`}
      aria-label="Run Without Stops"
    >
      <BrandMark className="size-[70%]" />
      <span className="sr-only">Run Without Stops</span>
    </a>
  );
}
