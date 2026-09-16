import * as Sentry from "@sentry/nextjs";
import { env } from "@/env";

const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "development" ? 1.0 : 0.1,
    includeLocalVariables: true,
    enableLogs: true,
  });
}
