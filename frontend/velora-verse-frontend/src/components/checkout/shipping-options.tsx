"use client";

import { Truck, Zap, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";

interface ShippingRate {
  method: string;
  charge: number;
  estimated_days: number;
}

interface ShippingOptionsProps {
  rates: ShippingRate[];
  selected: string | null;
  onSelect: (method: string) => void;
  freeThreshold?: number;
}

function getShippingIcon(method: string) {
  const lower = method.toLowerCase();
  if (lower.includes("express") || lower.includes("fast")) {
    return <Zap className="size-5" />;
  }
  if (lower.includes("standard") || lower.includes("regular")) {
    return <Truck className="size-5" />;
  }
  return <Package className="size-5" />;
}

export function ShippingOptions({
  rates,
  selected,
  onSelect,
  freeThreshold,
}: ShippingOptionsProps) {
  if (rates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Truck className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No shipping options available for this address. Please try a different
          PIN code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {freeThreshold !== undefined && freeThreshold > 0 && (
        <p className="text-sm text-muted-foreground">
          Free shipping on orders above {formatCurrency(freeThreshold)}
        </p>
      )}

      <RadioGroup value={selected ?? undefined} onValueChange={onSelect}>
        <div className="grid gap-3">
          {rates.map((rate) => {
            const isFree = rate.charge === 0;
            const isSelected = selected === rate.method;

            return (
              <Label
                key={rate.method}
                htmlFor={`shipping-${rate.method}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50",
                  isSelected && "border-primary bg-primary/5",
                  isFree && "ring-1 ring-green-500/20"
                )}
              >
                <RadioGroupItem
                  id={`shipping-${rate.method}`}
                  value={rate.method}
                />

                <div className="text-muted-foreground">
                  {getShippingIcon(rate.method)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rate.method}</span>
                    {isFree && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
                        Free
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rate.estimated_days === 1
                      ? "Delivered by tomorrow"
                      : `Estimated ${rate.estimated_days} days`}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-sm font-semibold",
                    isFree ? "text-green-600 dark:text-green-400" : "text-foreground"
                  )}
                >
                  {isFree ? "FREE" : formatCurrency(rate.charge)}
                </span>
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
