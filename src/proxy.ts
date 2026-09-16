import { clerkMiddleware } from "@clerk/nextjs/server";

// Public-first: the map works without an account. Protect future signed-in
// routes individually with `auth.protect()`.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!ingest|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
