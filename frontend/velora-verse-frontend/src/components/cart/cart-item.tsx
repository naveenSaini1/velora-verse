"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (name: string, quantity: number) => void;
  onRemove: (name: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const maxQty = item.max_qty ?? 99;

  return (
    <div className="flex gap-3 py-3">
      {/* Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted transition-transform duration-200 hover:scale-105">
        <FrappeImage
          src={item.image}
          alt={item.item_name ?? item.variant_title ?? "Product"}
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {item.item_name ?? item.variant_title ?? "Product"}
            </p>
            {item.variant_display && (
              <Badge variant="secondary" className="mt-1 text-xs rounded-full bg-primary/10 text-primary border-0">
                {item.variant_display}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive transition-colors duration-200"
            onClick={() => onRemove(item.variant)}
            aria-label={`Remove ${item.item_name ?? "item"}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-auto">
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-border/50"
              onClick={() => onUpdateQuantity(item.variant, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-border/50"
              onClick={() => onUpdateQuantity(item.variant, item.quantity + 1)}
              disabled={item.quantity >= maxQty}
              aria-label="Increase quantity"
            >
              <Plus className="size-3" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            {item.quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                <Currency amount={item.rate} /> each
              </p>
            )}
            <Currency amount={item.amount} className="text-sm font-semibold text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
