"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { getOrders, getOrderDetail } from "@/lib/api/orders";
import { createReturnRequest } from "@/lib/api/returns";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";
import { formatCurrency } from "@/lib/utils/format-currency";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FrappeImage } from "@/components/shared/frappe-image";
import { PageLoading } from "@/components/shared/loading-spinner";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

import type { Order, OrderItem } from "@/types/order";
import type { ReturnReason } from "@/types/return";

const RETURN_REASONS: ReturnReason[] = [
  "Defective",
  "Wrong Item",
  "Size Issue",
  "Changed Mind",
  "Other",
];

interface ReturnItemSelection {
  variant: string;
  item_name: string;
  variant_title?: string;
  image?: string;
  max_quantity: number;
  quantity: number;
  reason: ReturnReason;
}

export default function NewReturnPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderName, setSelectedOrderName] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [returnItems, setReturnItems] = useState<ReturnItemSelection[]>([]);
  const [reason, setReason] = useState<ReturnReason>("Defective");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
  }, [authLoading]);

  async function fetchOrders() {
    try {
      setLoadingOrders(true);
      const data = await getOrders({
        page: 1,
        limit: 50,
        status: "Delivered",
      });
      setOrders(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load orders");
      }
    } finally {
      setLoadingOrders(false);
    }
  }

  async function handleOrderSelect(orderName: string) {
    setSelectedOrderName(orderName);
    setReturnItems([]);
    setSelectedOrder(null);

    if (!orderName) return;

    try {
      // Fetch full order detail (with items) since getOrders doesn't return items
      const detail = await getOrderDetail(orderName);
      setSelectedOrder(detail);

      if (detail.items && detail.items.length > 0) {
        setReturnItems(
          detail.items.map((item) => ({
            variant: item.variant,
            item_name: item.item_name,
            variant_title: item.variant_title,
            image: item.image,
            max_quantity: item.quantity,
            quantity: 0,
            reason: "Defective" as ReturnReason,
          }))
        );
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load order details");
      }
    }
  }

  function updateItemQuantity(index: number, delta: number) {
    setReturnItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = Math.max(
          0,
          Math.min(item.max_quantity, item.quantity + delta)
        );
        return { ...item, quantity: newQty };
      })
    );
  }

  function updateItemReason(index: number, newReason: ReturnReason) {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, reason: newReason } : item
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const itemsToReturn = returnItems.filter((item) => item.quantity > 0);

    if (!selectedOrderName) {
      toast.error("Please select an order");
      return;
    }

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReturnRequest({
        order: selectedOrderName,
        return_type: "Return",
        reason,
        items: itemsToReturn.map((item) => ({
          variant: item.variant,
          quantity: item.quantity,
        })),
        reason_detail: itemsToReturn
          .map((item) => `${item.variant}: ${item.reason}`)
          .join("; "),
      });
      toast.success("Return request submitted successfully");
      router.push(ROUTES.RETURNS);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to submit return request");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 mb-1 rounded-xl"
          asChild
        >
          <Link href={ROUTES.RETURNS}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Returns
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Request a Return
        </h1>
        <p className="text-muted-foreground">
          Select the order and items you want to return
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Selection */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select Order</CardTitle>
            <CardDescription>
              Choose the order that contains the items you want to return
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No delivered orders available for return
              </p>
            ) : (
              <Select
                value={selectedOrderName}
                onValueChange={handleOrderSelect}
                disabled={isSubmitting}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select an order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.name} value={order.name}>
                      {order.name} - {formatCurrency(order.total)} (
                      {order.item_count ?? order.items?.length ?? 0} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Item Selection */}
        {selectedOrder && returnItems.length > 0 && (
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Select Items to Return
              </CardTitle>
              <CardDescription>
                Set the quantity you want to return for each item
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {returnItems.map((item, index) => (
                  <div key={item.variant} className="flex gap-4 p-4 sm:p-6">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60">
                      <FrappeImage
                        src={item.image}
                        alt={item.item_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-medium text-sm">{item.item_name}</p>
                        {item.variant_title && (
                          <p className="text-xs text-muted-foreground">
                            {item.variant_title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Max: {item.max_quantity}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Quantity selector */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => updateItemQuantity(index, -1)}
                            disabled={item.quantity === 0 || isSubmitting}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => updateItemQuantity(index, 1)}
                            disabled={
                              item.quantity >= item.max_quantity || isSubmitting
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Per-item reason */}
                        {item.quantity > 0 && (
                          <Select
                            value={item.reason}
                            onValueChange={(val: ReturnReason) =>
                              updateItemReason(index, val)
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-8 w-40 rounded-xl text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RETURN_REASONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reason & Notes */}
        {selectedOrder && (
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Return Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="return_reason">Primary Reason</Label>
                <Select
                  value={reason}
                  onValueChange={(val: ReturnReason) => setReason(val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="return_reason" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_notes">Additional Notes</Label>
                <Textarea
                  id="return_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details about your return..."
                  rows={3}
                  disabled={isSubmitting}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {selectedOrder && (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => router.push(ROUTES.RETURNS)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Return Request"
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
