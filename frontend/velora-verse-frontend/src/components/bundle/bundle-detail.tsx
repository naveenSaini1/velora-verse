"use client";

import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/hooks/use-cart";
import { ShoppingCart, Package } from "lucide-react";
import type { Bundle } from "@/types/bundle";

interface BundleDetailProps {
  bundle: Bundle;
}

export function BundleDetail({ bundle }: BundleDetailProps) {
  const { addToCart } = useCart();

  const handleAddBundle = async () => {
    // Add each item in the bundle to cart
    for (const item of bundle.bundle_items || []) {
      await addToCart(item.variant, undefined, item.quantity);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <FrappeImage
          src={bundle.image}
          alt={bundle.bundle_name}
          fill
          className="object-cover"
          priority
        />
        {bundle.savings_percent > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-4 right-4 text-lg px-3 py-1"
          >
            Save {Math.round(bundle.savings_percent)}%
          </Badge>
        )}
      </div>

      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">{bundle.bundle_name}</h1>
        {bundle.description && (
          <p className="mt-2 text-muted-foreground">{bundle.description}</p>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          <Currency
            amount={bundle.bundle_price}
            className="text-3xl font-bold"
          />
          {bundle.total_price > bundle.bundle_price && (
            <>
              <Currency
                amount={bundle.total_price}
                className="text-lg text-muted-foreground line-through"
              />
              <Badge variant="secondary">
                You save <Currency amount={bundle.savings} />
              </Badge>
            </>
          )}
        </div>

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Items in this bundle ({bundle.bundle_items?.length || 0})
        </h2>

        <div className="space-y-3 flex-1">
          {bundle.bundle_items?.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                  <FrappeImage
                    src={item.image}
                    alt={item.item_name || ""}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.item_name}
                  </p>
                  {item.variant_title && (
                    <p className="text-xs text-muted-foreground">
                      {item.variant_title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <Currency
                  amount={item.individual_price * item.quantity}
                  className="text-sm text-muted-foreground line-through"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleAddBundle} size="lg" className="mt-6 w-full">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add Bundle to Cart
        </Button>
      </div>
    </div>
  );
}
