"use client";

import { useCallback } from "react";
import { trackEvent } from "@/lib/api/analytics";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function useAnalytics() {
  const settings = useSettingsStore((s) => s.settings);

  const track = useCallback(
    (
      eventName: string,
      data?: {
        reference_doctype?: string;
        reference_name?: string;
        page_url?: string;
        event_data?: Record<string, unknown>;
      }
    ) => {
      if (!settings?.enable_analytics) return;
      // Fire and forget
      trackEvent({ event_name: eventName, ...data }).catch(() => {});
    },
    [settings?.enable_analytics]
  );

  return { track };
}
