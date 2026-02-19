"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  Package,
  XCircle,
  Check,
  Clock,
  Truck,
  PackageCheck,
  ShoppingBag,
  CircleX,
} from "lucide-react";
import { toast } from "sonner";

import { motion } from "framer-motion";
import { getOrderDetail, cancelOrder, getInvoiceUrl, getOrderTimeline } from "@/lib/api/orders";
import type { TimelineEntry } from "@/lib/api/orders";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { PageLoading } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";

import type { Order, OrderStatus } from "@/types/order";

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Shipped: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  Returned: "bg-muted text-muted-foreground",
};

const CANCELLABLE_STATUSES: OrderStatus[] = ["Pending", "Confirmed"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();

  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (authLoading || !orderId) return;
    fetchOrder();
  }, [authLoading, orderId]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const [data, timelineData] = await Promise.all([
        getOrderDetail(orderId),
        getOrderTimeline(orderId).catch(() => ({ timeline: [] })),
      ]);
      setOrder(data);
      setTimeline(timelineData.timeline ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load order details");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!order) return;

    setIsCancelling(true);
    try {
      await cancelOrder(order.name, cancelReason.trim() || undefined);
      toast.success("Order cancelled successfully");
      setCancelDialogOpen(false);
      setCancelReason("");
      router.push(ROUTES.ORDERS);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to cancel order");
      }
    } finally {
      setIsCancelling(false);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href={ROUTES.ORDERS}>Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 mb-1 rounded-xl"
            asChild
          >
            <Link href={ROUTES.ORDERS}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{order.name}</h1>
            <Badge className={STATUS_COLORS[order.status]} variant="secondary">
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDateTime(order.order_date || order.creation)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            asChild
          >
            <a href={getInvoiceUrl(order.name)} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1.5 h-4 w-4" />
              Download Invoice
            </a>
          </Button>

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Order Tracking Timeline */}
      <OrderTimeline
        status={order.status}
        orderDate={order.order_date || order.creation}
        deliveredOn={order.delivered_on}
        timeline={timeline}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: items + summary */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Items ({order.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {(order.items ?? []).map((item) => (
                  <div key={item.name} className="flex gap-4 p-4 sm:p-6">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60">
                      <FrappeImage
                        src={item.image}
                        alt={item.item_name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-1">
                      <div>
                        {item.slug ? (
                          <Link
                            href={ROUTES.PRODUCT_DETAIL(item.slug)}
                            className="font-medium hover:text-primary transition-colors duration-200"
                          >
                            {item.item_name}
                          </Link>
                        ) : (
                          <p className="font-medium">{item.item_name}</p>
                        )}
                        {item.variant_title && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant_title}
                          </p>
                        )}
                        {!!item.is_bundle_item && (
                          <Badge
                            variant="outline"
                            className="mt-1 rounded-full text-xs"
                          >
                            Bundle Item
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(item.rate)} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <Currency amount={order.subtotal} />
              </div>

              {(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Coupon Discount
                    {order.coupon_code && (
                      <span className="ml-1 text-xs">
                        ({order.coupon_code})
                      </span>
                    )}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    -{formatCurrency(order.discount_amount)}
                  </span>
                </div>
              )}

              {(order.loyalty_discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Loyalty Points ({(order.loyalty_points_redeemed ?? 0)} pts)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    -{formatCurrency(order.loyalty_discount)}
                  </span>
                </div>
              )}

              {(order.segment_discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Segment Discount
                    {order.segment_name && (
                      <span className="ml-1 text-xs">
                        ({order.segment_name})
                      </span>
                    )}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    -{formatCurrency(order.segment_discount)}
                  </span>
                </div>
              )}

              {(order.gift_card_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Gift Card
                    {order.gift_card_code && (
                      <span className="ml-1 text-xs">
                        ({order.gift_card_code})
                      </span>
                    )}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    -{formatCurrency(order.gift_card_amount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <Currency
                  amount={order.shipping_charge}
                  className={
                    order.shipping_charge === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ""
                  }
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax
                  {(order.tax_rate ?? 0) > 0 && (
                    <span className="ml-1 text-xs">({order.tax_rate}%)</span>
                  )}
                </span>
                <Currency amount={order.tax_amount} />
              </div>

              {/* GST breakdown */}
              {((order.cgst_amount ?? 0) > 0 ||
                (order.sgst_amount ?? 0) > 0 ||
                (order.igst_amount ?? 0) > 0) && (
                <div className="ml-4 space-y-1 text-xs text-muted-foreground">
                  {order.is_igst ? (
                    <div className="flex justify-between">
                      <span>IGST</span>
                      <span>{formatCurrency(order.igst_amount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST</span>
                        <span>{formatCurrency(order.cgst_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST</span>
                        <span>{formatCurrency(order.sgst_amount)}</span>
                      </div>
                    </>
                  )}
                  {(order.cess_amount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Cess</span>
                      <span>{formatCurrency(order.cess_amount)}</span>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <Currency amount={order.total} />
              </div>

              {(order.loyalty_points_earned ?? 0) > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  You earned {order.loyalty_points_earned} loyalty points on
                  this order
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: details */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {order.shipping_address_display && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {order.shipping_address_display}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Billing Address */}
          {order.billing_address_display && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {order.billing_address_display}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.payment_method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>{order.payment_method}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="rounded-full">
                  {order.payment_status}
                </Badge>
              </div>
              {order.payment_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs">{order.payment_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.tracking_number && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tracking Number
                  </span>
                  <span className="font-mono text-xs">
                    {order.tracking_number}
                  </span>
                </div>
                {order.tracking_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl"
                    asChild
                  >
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track Shipment
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
                {order.delivered_on && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivered</span>
                    <span>{formatDateTime(order.delivered_on)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Reason */}
          {order.cancelled_reason && (
            <Card className="rounded-2xl border-red-500/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-red-600 dark:text-red-400">
                  Cancellation Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {order.cancelled_reason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {order.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cancel_reason">
              Reason for cancellation (optional)
            </Label>
            <Textarea
              id="cancel_reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us why you're cancelling..."
              rows={3}
              disabled={isCancelling}
              className="rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Tracking Timeline
// ---------------------------------------------------------------------------

const TIMELINE_STEPS = [
  { status: "Pending", label: "Order Placed", icon: ShoppingBag },
  { status: "Confirmed", label: "Confirmed", icon: Check },
  { status: "Processing", label: "Processing", icon: Clock },
  { status: "Shipped", label: "Shipped", icon: Truck },
  { status: "Delivered", label: "Delivered", icon: PackageCheck },
] as const;

const STATUS_ORDER: Record<string, number> = {
  Pending: 0,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
};

function OrderTimeline({
  status,
  orderDate,
  deliveredOn,
  timeline,
}: {
  status: OrderStatus;
  orderDate: string;
  deliveredOn?: string;
  timeline: TimelineEntry[];
}) {
  // Build a map of status → timestamp from the timeline log
  const statusDates = new Map<string, string>();
  for (const entry of timeline) {
    if (!statusDates.has(entry.status)) {
      statusDates.set(entry.status, entry.timestamp);
    }
  }
  // Fallbacks for Order Placed and Delivered
  if (!statusDates.has("Pending") && orderDate) {
    statusDates.set("Pending", orderDate);
  }
  if (!statusDates.has("Delivered") && deliveredOn) {
    statusDates.set("Delivered", deliveredOn);
  }

  if (status === "Cancelled") {
    const cancelledAt = statusDates.get("Cancelled");
    return (
      <Card className="rounded-2xl border-red-500/20 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CircleX className="h-5 w-5 text-red-500" />
            </motion.div>
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">
                Order Cancelled
              </p>
              <p className="text-sm text-muted-foreground">
                {cancelledAt ? formatDateTime(cancelledAt) : "This order has been cancelled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "Returned") {
    return (
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Package className="h-5 w-5 text-muted-foreground" />
            </motion.div>
            <div>
              <p className="font-medium">Order Returned</p>
              <p className="text-sm text-muted-foreground">
                This order has been returned
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStep = STATUS_ORDER[status] ?? 0;
  const progressPct = (currentStep / (TIMELINE_STEPS.length - 1)) * 100;

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        {/* Desktop: Horizontal timeline */}
        <div className="hidden sm:block">
          <div className="relative flex items-center justify-between">
            {/* Connecting line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>

            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const StepIcon = step.icon;
              const stepDate = statusDates.get(step.status);

              return (
                <motion.div
                  key={step.status}
                  className="relative z-10 flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <motion.div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                      isCurrent && "ring-4 ring-primary/20"
                    )}
                    initial={isCompleted ? { scale: 0.5 } : {}}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.1 }}
                  >
                    <StepIcon className="h-4 w-4" />
                  </motion.div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {stepDate && isCompleted && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(stepDate)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="sm:hidden">
          <div className="relative flex flex-col gap-0">
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const isLast = index === TIMELINE_STEPS.length - 1;
              const StepIcon = step.icon;
              const stepDate = statusDates.get(step.status);

              return (
                <motion.div
                  key={step.status}
                  className="relative flex gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  {/* Vertical line */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 h-[calc(100%-16px)] w-0.5">
                      <div
                        className={cn(
                          "h-full w-full",
                          isCompleted && index < currentStep
                            ? "bg-primary"
                            : "bg-border"
                        )}
                      />
                    </div>
                  )}

                  {/* Step circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                      isCurrent && "ring-4 ring-primary/20"
                    )}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>

                  {/* Label + date */}
                  <div className={cn("pb-6", isLast && "pb-0")}>
                    <p
                      className={cn(
                        "text-sm font-medium leading-10",
                        isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    {stepDate && isCompleted && (
                      <p className="text-xs text-muted-foreground -mt-2">
                        {formatDate(stepDate)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
