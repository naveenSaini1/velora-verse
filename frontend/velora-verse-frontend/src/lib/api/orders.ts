import { frappeCall, frappeGet, getFrappeUrl } from "./client";
import type { Order } from "@/types/order";
import type { PaginatedResponse } from "@/types/api";
import { toPaginatedResponse } from "@/types/api";

export async function placeOrder(data: {
  shipping_address: string;
  billing_address?: string;
  payment_method: string;
  coupon_code?: string;
  loyalty_points?: number;
  gift_card_code?: string;
  notes?: string;
}) {
  return frappeCall<Order>("velora_verse.velora_verse.doctype.order.order.place_order", data);
}

export async function getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> {
  const raw = await frappeGet<{
    orders: Order[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  }>(
    "velora_verse.velora_verse.doctype.order.order.get_orders",
    params as Record<string, unknown>
  );
  return toPaginatedResponse(raw.orders ?? [], raw);
}

export async function getOrderDetail(order_name: string) {
  return frappeGet<Order>(
    "velora_verse.velora_verse.doctype.order.order.get_order_detail",
    { order_name }
  );
}

export async function cancelOrder(order_name: string, reason?: string) {
  return frappeCall(
    "velora_verse.velora_verse.doctype.order.order.cancel_order",
    { order_name, reason }
  );
}

export interface TimelineEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export async function getOrderTimeline(order_name: string) {
  return frappeGet<{ timeline: TimelineEntry[] }>(
    "velora_verse.velora_verse.doctype.order.order.get_order_timeline",
    { order_name }
  );
}

export function getInvoiceUrl(orderName: string): string {
  return `${getFrappeUrl()}/api/method/velora_verse.api.invoices.download_invoice?order_name=${encodeURIComponent(orderName)}`;
}
