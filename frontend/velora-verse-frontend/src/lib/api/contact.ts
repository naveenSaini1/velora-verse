import { frappeCall } from "./client";

export async function submitContact(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return frappeCall<{ message: string }>(
    "velora_verse.api.contact.submit_contact",
    data
  );
}
