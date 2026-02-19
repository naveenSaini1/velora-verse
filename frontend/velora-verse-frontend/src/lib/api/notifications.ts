import { frappeCall, frappeGet } from "./client";
import type { UserNotification } from "@/types/notification";
import type { PaginatedResponse } from "@/types/api";

export async function getNotifications(params?: { page?: number; page_size?: number; unread_only?: boolean }) {
  // Backend expects `limit` not `page_size`
  const { page_size, ...rest } = params ?? {};
  return frappeGet<PaginatedResponse<UserNotification>>(
    "velora_verse.api.notification_center.get_notifications",
    { ...rest, limit: page_size } as Record<string, unknown>
  );
}

export async function getUnreadCount() {
  return frappeGet<{ count: number }>("velora_verse.api.notification_center.get_unread_count");
}

export async function markAsRead(name: string) {
  return frappeCall("velora_verse.api.notification_center.mark_as_read", { notification_name: name });
}

export async function markAllRead() {
  return frappeCall("velora_verse.api.notification_center.mark_all_read");
}

export async function deleteNotification(name: string) {
  return frappeCall("velora_verse.api.notification_center.delete_notification", { notification_name: name });
}
