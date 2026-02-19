"use client";

import { Tag, X } from "lucide-react";
import { Currency } from "@/components/shared/currency";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Cart } from "@/types/cart";

interface CartSummaryProps {
  cart: Cart;
  showCoupon?: boolean;
  onRemoveCoupon?: () => void;
}

export function CartSummary({
  cart,
  showCoupon = true,
  onRemoveCoupon,
}: CartSummaryProps) {
  const subtotal = cart.subtotal ?? cart.total;
  const shippingCharge = cart.shipping_charge ?? 0;
  const discountAmount = cart.discount_amount ?? 0;
  const taxAmount = cart.tax_amount ?? 0;

  return (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <Currency amount={subtotal} />
      </div>

      {/* Shipping */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        {shippingCharge > 0 ? (
          <Currency amount={shippingCharge} />
        ) : (
          <span className="text-emerald-600 font-medium">Free</span>
        )}
      </div>

      {/* Discount */}
      {discountAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-emerald-600 font-medium">
            -<Currency amount={discountAmount} />
          </span>
        </div>
      )}

      {/* Tax */}
      {taxAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <Currency amount={taxAmount} />
        </div>
      )}

      {/* Applied coupon */}
      {showCoupon && cart.coupon_code && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50/80 px-3 py-2 dark:border-emerald-700 dark:bg-emerald-950/50">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <Tag className="size-3.5" />
            <span className="font-medium">{cart.coupon_code}</span>
          </div>
          {onRemoveCoupon && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onRemoveCoupon}
              aria-label="Remove coupon"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      )}

      <Separator />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">Total</span>
        <Currency amount={cart.total} className="text-lg font-bold text-primary" />
      </div>
    </div>
  );
}
