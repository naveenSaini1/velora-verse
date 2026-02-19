import { frappeCall } from "./client";

export async function trackEvent(data: {
  event_name: string;
  reference_doctype?: string;
  reference_name?: string;
  page_url?: string;
  event_data?: Record<string, unknown>;
}) {
  return frappeCall("velora_verse.api.analytics.track_event", data);
}
