"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Tag, Gift, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";

interface OrderSummaryItem {
  name?: string;
  variant?: string;
  item_name?: string;
  variant_title?: string;
  quantity: number;
  rate: number;
  amount: number;
  image?: string;
}

interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  loyaltyDiscount?: number;
  giftCardAmount?: number;
  tax: number;
  total: number;
}

export function OrderSummary({
  items,
  subtotal,
  shipping,
  discount = 0,
  couponCode,
  loyaltyDiscount = 0,
  giftCardAmount = 0,
  tax,
  total,
}: OrderSummaryProps) {
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const totalDiscounts = discount + loyaltyDiscount + giftCardAmount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items list -- collapsible on mobile */}
        <div>
          {/* Mobile toggle */}
          <button
            type="button"
            className="flex w-full items-center justify-between sm:hidden"
            onClick={() => setItemsExpanded((prev) => !prev)}
          >
            <span className="text-sm font-medium">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
            {itemsExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {/* Item list -- always visible on desktop, toggled on mobile */}
          <div
            className={cn(
              "space-y-3",
              !itemsExpanded && "hidden sm:block"
            )}
          >
            {items.map((item) => (
              <div key={item.name || item.variant} className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md border">
                  <FrappeImage
                    src={item.image}
                    alt={item.variant_title || item.item_name || "Product"}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                  {/* Quantity badge */}
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {item.quantity}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.variant_title || item.item_name || "Product"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.rate)} x {item.quantity}
                  </p>
                </div>

                <Currency
                  amount={item.amount}
                  className="text-sm font-medium shrink-0"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <Currency amount={subtotal} />
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          {shipping === 0 ? (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200"
            >
              Free
            </Badge>
          ) : (
            <Currency amount={shipping} />
          )}
        </div>

        {/* Coupon discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="size-3.5" />
              Coupon
              {couponCode && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {couponCode}
                </Badge>
              )}
            </span>
            <span className="text-green-600 dark:text-green-400">
              -{formatCurrency(discount)}
            </span>
          </div>
        )}

        {/* Loyalty discount */}
        {loyaltyDiscount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Award className="size-3.5" />
              Loyalty Points
            </span>
            <span className="text-green-600 dark:text-green-400">
              -{formatCurrency(loyaltyDiscount)}
            </span>
          </div>
        )}

        {/* Gift card */}
        {giftCardAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Gift className="size-3.5" />
              Gift Card
            </span>
            <span className="text-green-600 dark:text-green-400">
              -{formatCurrency(giftCardAmount)}
            </span>
          </div>
        )}

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <Currency amount={tax} />
        </div>

        {/* Total savings banner */}
        {totalDiscounts > 0 && (
          <>
            <Separator />
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              You are saving {formatCurrency(totalDiscounts)} on this order
            </div>
          </>
        )}

        <Separator />

        {/* Grand total */}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">Total</span>
          <Currency amount={total} className="text-lg font-bold" />
        </div>
      </CardContent>
    </Card>
  );
}
