"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createReturnRequest } from "@/lib/api/returns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { OrderItem } from "@/types/order";

const RETURN_REASONS = [
  "Defective",
  "Wrong Item",
  "Size Issue",
  "Changed Mind",
  "Other",
] as const;

interface ReturnRequestFormProps {
  orderName: string;
  items: OrderItem[];
  onSuccess: () => void;
}

export function ReturnRequestForm({
  orderName,
  items,
  onSuccess,
}: ReturnRequestFormProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [returnItems, setReturnItems] = useState<
    Array<{ variant: string; item_name: string; quantity: number; reason: string }>
  >(
    items.map((item) => ({
      variant: item.variant,
      item_name: item.item_name,
      quantity: 0,
      reason: "",
    }))
  );
  const [loading, setLoading] = useState(false);

  const updateItemQuantity = (index: number, quantity: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.min(quantity, items[i].quantity) }
          : item
      )
    );
  };

  const hasSelectedItems = returnItems.some((item) => item.quantity > 0);

  const handleSubmit = async () => {
    if (!reason || !hasSelectedItems) return;
    setLoading(true);
    try {
      const selectedItems = returnItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({ variant: item.variant, quantity: item.quantity }));
      await createReturnRequest({
        order: orderName,
        return_type: "Return",
        reason,
        items: selectedItems,
        reason_detail: notes || undefined,
      });
      toast.success("Return request submitted");
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit return request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Reason for Return</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select a reason" />
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

      <div>
        <Label>Items to Return</Label>
        <div className="mt-2 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.item_name}</p>
                {item.variant_title && (
                  <p className="text-xs text-muted-foreground">
                    {item.variant_title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ordered: {item.quantity}
                </p>
              </div>
              <Input
                type="number"
                min={0}
                max={item.quantity}
                value={returnItems[idx]?.quantity || 0}
                onChange={(e) =>
                  updateItemQuantity(idx, parseInt(e.target.value) || 0)
                }
                className="w-20"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Additional Notes (Optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details..."
          className="mt-1.5"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !reason || !hasSelectedItems}
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Return Request
      </Button>
    </div>
  );
}
