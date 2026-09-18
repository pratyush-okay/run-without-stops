import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

function clerkKey(prefix: "pk" | "sk") {
  return z
    .string()
    .min(1)
    .optional()
    .superRefine((value, context) => {
      if (process.env.VERCEL_ENV === "production" && value?.startsWith(`${prefix}_test_`)) {
        context.addIssue({
          code: "custom",
          message: `Production cannot use a Clerk ${prefix}_test_ development key`,
        });
      }
    });
}

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  server: {
    GRAPHHOPPER_API_KEY: z.string().min(1).optional(),
    GRAPHHOPPER_API_URL: z.string().url().default("https://graphhopper.com/api/1"),
    VALHALLA_API_URL: z.string().url().default("https://valhalla1.openstreetmap.de/route"),
    STADIA_MAPS_API_KEY: z.string().min(1).optional(),
    TRACESTRACK_API_KEY: z.string().min(1).optional(),
    TRACESTRACK_OVERPASS_URL: z.string().url().default("https://api.tracestrack.com/overpass"),
    OVERPASS_API_URL: z.string().url().default("https://overpass-api.de/api/interpreter"),
    CLERK_SECRET_KEY: clerkKey("sk"),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey("pk"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default("https://eu.i.posthog.com"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    GRAPHHOPPER_API_KEY: process.env.GRAPHHOPPER_API_KEY,
    GRAPHHOPPER_API_URL: process.env.GRAPHHOPPER_API_URL,
    VALHALLA_API_URL: process.env.VALHALLA_API_URL,
    STADIA_MAPS_API_KEY: process.env.STADIA_MAPS_API_KEY,
    TRACESTRACK_API_KEY: process.env.TRACESTRACK_API_KEY,
    TRACESTRACK_OVERPASS_URL: process.env.TRACESTRACK_OVERPASS_URL,
    OVERPASS_API_URL: process.env.OVERPASS_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
