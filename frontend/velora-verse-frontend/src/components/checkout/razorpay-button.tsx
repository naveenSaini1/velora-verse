"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPayment } from "@/lib/api/payments";
import { formatCurrency } from "@/lib/utils/format-currency";

interface RazorpayButtonProps {
  orderName: string;
  amount: number;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onError: (error: unknown) => void;
}

export function RazorpayButton({
  orderName,
  amount,
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const paymentData = await createPayment({
        order_name: orderName,
        payment_method: "Razorpay",
      });

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay SDK not loaded. Please refresh the page and try again."
        );
      }

      const options: RazorpayOptions = {
        key: paymentData.razorpay_key_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        order_id: paymentData.razorpay_order_id,
        name: "Velora Verse",
        description: `Payment for ${orderName}`,
        handler: (response: RazorpaySuccessResponse) => {
          onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: {
          color: "hsl(var(--primary))",
        },
      };

      if (!window.Razorpay) {
        setLoading(false);
        onError(new Error("Payment gateway is still loading. Please try again."));
        return;
      }
      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (response: unknown) => {
        setLoading(false);
        onError(response);
      });

      razorpayInstance.open();
    } catch (error) {
      setLoading(false);
      onError(error);
    }
  }

  return (
    <Button
      className="w-full"
      size="lg"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CreditCard className="size-4" />
      )}
      {loading ? "Processing..." : `Pay ${formatCurrency(amount)}`}
    </Button>
  );
}
