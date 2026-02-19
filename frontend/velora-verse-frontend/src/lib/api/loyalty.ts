import { frappeGet } from "./client";
import type { LoyaltyBalance, LoyaltyTransaction } from "@/types/loyalty";

export async function getLoyaltyBalance() {
  return frappeGet<LoyaltyBalance>("velora_verse.api.loyalty.get_loyalty_balance");
}

export async function getLoyaltyHistory(params?: { page?: number; limit?: number }) {
  return frappeGet<{
    entries: LoyaltyTransaction[];
    balance: number;
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  }>("velora_verse.api.loyalty.get_loyalty_history", params as Record<string, unknown>);
}

export async function previewLoyaltyRedemption(data: { points_to_redeem: number }) {
  return frappeGet<{
    redeemable: boolean;
    points_to_redeem: number;
    discount_amount: number;
    remaining_balance: number;
    message?: string;
  }>("velora_verse.api.loyalty.preview_loyalty_redemption", data);
}
