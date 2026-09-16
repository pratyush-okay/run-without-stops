export default function SharedRouteNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-6 text-center text-white">
      <div className="max-w-md">
        <p className="rws-kicker">Shared route</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">This link is no longer live</h1>
        <p className="mt-2 text-sm text-white/55">
          The route may have been deleted, or the link is incomplete.
        </p>
        <a href="/" className="rws-button mt-6 inline-flex min-h-10 items-center px-4">
          Plan a route
        </a>
      </div>
    </main>
  );
}
