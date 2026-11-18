"use client";

import { useEffect, useRef } from "react";
import type { AppSyncEventsClient } from "./appsync-events-client";

/**
 * Subscribes to one AppSync Events channel for the lifetime of the
 * component (or while `channel` is non-null) and cleans up on unmount or
 * channel change. `onEvent` is kept in a ref so callers don't need to
 * memoize it to avoid resubscribing on every render.
 */
export function useAppSyncEventsSubscription<T>(
  client: AppSyncEventsClient,
  channel: string | null,
  onEvent: (event: T) => void,
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!channel) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    client
      .subscribe(channel, (event) => onEventRef.current(event as T))
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribe = unsub;
      })
      .catch((error: unknown) => {
        console.error(`[AppSync Events] subscribe failed for ${channel}:`, error);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [client, channel]);
}
