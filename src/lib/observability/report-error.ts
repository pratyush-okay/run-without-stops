import * as Sentry from "@sentry/nextjs";

export function reportError(error: unknown, tags?: Record<string, string>) {
  Sentry.captureException(error, tags ? { tags } : undefined);
}
