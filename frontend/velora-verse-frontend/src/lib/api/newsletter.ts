import { frappeCall } from "./client";

export async function subscribeNewsletter(email: string) {
  return frappeCall<{ message: string }>(
    "velora_verse.api.newsletter.subscribe",
    { email }
  );
}
