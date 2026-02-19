import { frappeCall } from "./client";

export async function createPayment(data: { order_name: string; payment_method: string }) {
  return frappeCall<{
    payment_method: string;
    razorpay_order_id: string;
    razorpay_key_id: string;
    amount: number;
    currency: string;
    order_name: string;
  }>("velora_verse.api.payments.create_payment", data);
}

export async function verifyPayment(data: {
  order_name: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) {
  return frappeCall<{ verified: boolean; order_name: string; payment_id: string }>(
    "velora_verse.api.payments.verify_payment",
    data
  );
}
