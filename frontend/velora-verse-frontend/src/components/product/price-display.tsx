"use client";

import { Currency } from "@/components/shared/currency";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  basePrice: number;
  salePrice?: number | null;
  className?: string;
}

export function PriceDisplay({
  basePrice,
  salePrice,
  className,
}: PriceDisplayProps) {
  const hasDiscount = salePrice != null && salePrice < basePrice;
  const percentOff = hasDiscount
    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {hasDiscount ? (
        <>
          <Currency
            amount={salePrice}
            className="text-lg font-bold text-foreground"
          />
          <Currency
            amount={basePrice}
            className="text-sm text-muted-foreground line-through"
          />
          <Badge variant="secondary" className="text-xs font-medium">
            {percentOff}% off
          </Badge>
        </>
      ) : (
        <Currency
          amount={basePrice}
          className="text-lg font-bold text-foreground"
        />
      )}
    </div>
  );
}
