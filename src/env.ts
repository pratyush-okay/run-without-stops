import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    GRAPHHOPPER_API_KEY: z.string().min(1).optional(),
    GRAPHHOPPER_API_URL: z.string().url().default("https://graphhopper.com/api/1"),
    VALHALLA_API_URL: z.string().url().default("https://valhalla1.openstreetmap.de/route"),
    STADIA_MAPS_API_KEY: z.string().min(1).optional(),
    TRACESTRACK_API_KEY: z.string().min(1).optional(),
    TRACESTRACK_OVERPASS_URL: z.string().url().default("https://api.tracestrack.com/overpass"),
    OVERPASS_API_URL: z.string().url().default("https://overpass-api.de/api/interpreter"),
    CLERK_SECRET_KEY: z.string().min(1).optional(),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
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
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
