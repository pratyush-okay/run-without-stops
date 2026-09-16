"use client";

import { useUser } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { captureEvent } from "@/lib/analytics/client";
import { analyticsEvents } from "@/lib/analytics/events";

export function IdentifyUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedId = useRef<string>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (identifiedId.current === user.id) return;
      identifiedId.current = user.id;
      const username =
        user.username ??
        (typeof user.unsafeMetadata.username === "string"
          ? user.unsafeMetadata.username
          : undefined);
      const email = user.primaryEmailAddress?.emailAddress;
      posthog.identify(user.id, {
        ...(email ? { email } : {}),
        ...(username ? { username } : {}),
        ...(user.fullName ? { name: user.fullName } : {}),
      });
      Sentry.setUser({
        id: user.id,
        ...(email ? { email } : {}),
        ...(username ? { username } : {}),
      });
      captureEvent(analyticsEvents.userSignedIn);
      return;
    }

    if (identifiedId.current) {
      captureEvent(analyticsEvents.userSignedOut);
      posthog.reset();
      Sentry.setUser(null);
      identifiedId.current = undefined;
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
