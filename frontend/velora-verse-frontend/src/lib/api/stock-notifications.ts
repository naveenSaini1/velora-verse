import { frappeCall, frappeGet } from "./client";

export async function subscribeStockNotification(data: { variant: string }) {
  return frappeCall(
    "velora_verse.velora_verse.doctype.stock_notification.stock_notification.subscribe_stock_notification",
    data
  );
}

export async function unsubscribeStockNotification(data: { variant: string }) {
  return frappeCall(
    "velora_verse.velora_verse.doctype.stock_notification.stock_notification.unsubscribe_stock_notification",
    data
  );
}

export async function checkStockSubscription(data: { variant: string }) {
  return frappeGet<{ subscribed: boolean }>(
    "velora_verse.velora_verse.doctype.stock_notification.stock_notification.check_stock_subscription",
    data
  );
}
