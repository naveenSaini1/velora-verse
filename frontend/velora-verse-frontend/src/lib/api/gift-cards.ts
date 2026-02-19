import { frappeCall, frappeGet } from "./client";
import type { GiftCard } from "@/types/gift-card";

export async function purchaseGiftCard(data: {
  amount: number;
  recipient_email?: string;
  recipient_name?: string;
  sender_message?: string;
}) {
  return frappeCall<{ message: string; card_code: string; amount: number; expiry_date: string }>(
    "velora_verse.api.gift_cards.purchase_gift_card",
    data
  );
}

export async function checkGiftCardBalance(card_code: string) {
  return frappeGet<{
    card_code: string;
    original_amount: number;
    current_balance: number;
    status: string;
    expiry_date: string;
    is_valid: boolean;
  }>("velora_verse.api.gift_cards.check_gift_card_balance", { card_code });
}

export async function getMyGiftCards() {
  return frappeGet<{ purchased: GiftCard[]; received: GiftCard[] }>(
    "velora_verse.api.gift_cards.get_my_gift_cards"
  );
}

export async function previewGiftCardRedemption(data: { card_code: string; amount?: number }) {
  return frappeGet<{
    valid: boolean;
    available_balance: number;
    redeem_amount: number;
    remaining_balance: number;
    message?: string;
  }>("velora_verse.api.gift_cards.preview_gift_card_redemption", data);
}
