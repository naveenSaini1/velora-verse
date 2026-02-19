import { frappeCall, frappeGet } from "./client";
import type { ReturnRequest } from "@/types/return";

export async function getReturnRequests(params?: { page?: number; limit?: number }) {
  return frappeGet<{
    return_requests: ReturnRequest[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  }>(
    "velora_verse.velora_verse.doctype.return_request.return_request.get_return_requests",
    params as Record<string, unknown>
  );
}

export async function createReturnRequest(data: {
  order: string;
  return_type: string;
  reason: string;
  items: Array<{ variant: string; quantity: number }>;
  reason_detail?: string;
}) {
  return frappeCall<{
    message: string;
    return_request: string;
    status: string;
    refund_amount: number;
  }>(
    "velora_verse.velora_verse.doctype.return_request.return_request.create_return_request",
    { ...data, items: JSON.stringify(data.items) }
  );
}
