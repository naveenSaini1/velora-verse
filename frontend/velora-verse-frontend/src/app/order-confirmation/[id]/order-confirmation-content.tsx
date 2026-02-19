"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { getOrderDetail } from "@/lib/api/orders";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/format-date";
import type { Order } from "@/types/order";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Currency } from "@/components/shared/currency";
import { FrappeImage } from "@/components/shared/frappe-image";
import { PageLoading } from "@/components/shared/loading-spinner";
import { ErrorDisplay } from "@/components/shared/error-display";

interface OrderConfirmationContentProps {
  orderId: string;
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Confirmed":
    case "Delivered":
      return "default";
    case "Processing":
    case "Shipped":
      return "secondary";
    case "Cancelled":
    case "Returned":
      return "destructive";
    default:
      return "outline";
  }
}

function getPaymentStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Paid":
      return "default";
    case "Unpaid":
      return "outline";
    case "Refunded":
    case "Partially Refunded":
      return "secondary";
    default:
      return "outline";
  }
}

export function OrderConfirmationContent({
  orderId,
}: OrderConfirmationContentProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder(retries = 3) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await getOrderDetail(orderId);
          if (!cancelled) {
            setOrder(data);
            setIsLoading(false);
          }
          return;
        } catch (err) {
          // Retry on failure (order may not be committed yet)
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to load order details"
            );
            setIsLoading(false);
          }
        }
      }
    }
    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <ErrorDisplay
          title="Order Not Found"
          message={error ?? "We couldn't find this order. It may have been removed or the link is incorrect."}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Success banner */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Thank you for your order!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. We&apos;ll send you a confirmation email shortly.
        </p>
      </div>

      {/* Order info header */}
      <Card className="mb-6 rounded-2xl shadow-sm shadow-black/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-lg font-bold">{order.name}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="text-sm font-medium">
                {formatDate(order.order_date || order.creation)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-3">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status}
            </Badge>
            <Badge variant={getPaymentStatusVariant(order.payment_status)}>
              {order.payment_status}
            </Badge>
            {order.payment_method && (
              <Badge variant="outline">{order.payment_method}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(order.items ?? []).map((item) => (
              <div key={item.name || item.variant} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted">
                  <FrappeImage
                    src={item.image}
                    alt={item.item_name || item.variant_title || "Product"}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {item.slug ? (
                    <Link
                      href={ROUTES.PRODUCT_DETAIL(item.slug)}
                      className="text-sm font-medium hover:underline"
                    >
                      {item.item_name || item.variant_title || "Product"}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">
                      {item.item_name || item.variant_title || "Product"}
                    </p>
                  )}
                  {item.variant_title && item.variant_title !== item.item_name && (
                    <p className="text-xs text-muted-foreground">
                      {item.variant_title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    <Currency amount={item.rate} /> x {item.quantity}
                  </p>
                </div>
                <Currency amount={item.amount} className="text-sm font-semibold" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment & shipping details */}
      <div className="grid gap-6 sm:grid-cols-2 mb-6">
        {/* Payment details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">
                {order.payment_method === "Razorpay"
                  ? "Online Payment"
                  : order.payment_method || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={getPaymentStatusVariant(order.payment_status)}
                className="text-xs"
              >
                {order.payment_status}
              </Badge>
            </div>
            {order.payment_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{order.payment_id}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipping_address_display ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {order.shipping_address_display}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.shipping_address}
              </p>
            )}
            {order.tracking_number && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 p-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Tracking Number
                  </p>
                  {order.tracking_url ? (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {order.tracking_number}
                    </a>
                  ) : (
                    <p className="text-sm font-medium">
                      {order.tracking_number}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order total breakdown */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <Currency amount={order.subtotal} />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              {order.shipping_charge === 0 ? (
                <span className="text-emerald-600 font-medium">Free</span>
              ) : (
                <Currency amount={order.shipping_charge} />
              )}
            </div>

            {order.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <Currency amount={order.tax_amount} />
              </div>
            )}

            {(order.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Coupon Discount
                  {order.coupon_code && (
                    <span className="ml-1 font-mono text-xs">
                      ({order.coupon_code})
                    </span>
                  )}
                </span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={order.discount_amount} />
                </span>
              </div>
            )}

            {(order.loyalty_discount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Loyalty Points ({(order.loyalty_points_redeemed ?? 0).toLocaleString()} pts)
                </span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={order.loyalty_discount} />
                </span>
              </div>
            )}

            {(order.segment_discount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Segment Discount
                  {order.segment_name && (
                    <span className="ml-1">({order.segment_name})</span>
                  )}
                </span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={order.segment_discount} />
                </span>
              </div>
            )}

            {(order.gift_card_amount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Gift Card
                  {order.gift_card_code && (
                    <span className="ml-1 font-mono text-xs">
                      ({order.gift_card_code})
                    </span>
                  )}
                </span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={order.gift_card_amount} />
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between">
              <span className="text-lg font-bold">Grand Total</span>
              <Currency amount={order.total} className="text-xl font-bold text-primary" />
            </div>

            {(order.loyalty_points_earned ?? 0) > 0 && (
              <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                <span className="text-primary">
                  You earned{" "}
                  <span className="font-semibold">
                    {(order.loyalty_points_earned ?? 0).toLocaleString()}
                  </span>{" "}
                  loyalty points from this order!
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild className="rounded-xl transition-all duration-200">
          <Link href={ROUTES.PRODUCTS}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
        <Button variant="outline" asChild className="rounded-xl transition-all duration-200">
          <Link href={ROUTES.ORDERS}>
            <Package className="mr-2 h-4 w-4" />
            View All Orders
          </Link>
        </Button>
      </div>
    </div>
  );
}
