import { frappeCall } from "./client";

export async function validateCoupon(data: { coupon_code: string }) {
  return frappeCall<{
    valid: boolean;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    new_total: number;
    message?: string;
  }>(
    "velora_verse.velora_verse.doctype.coupon.coupon.validate_coupon",
    data
  );
}
