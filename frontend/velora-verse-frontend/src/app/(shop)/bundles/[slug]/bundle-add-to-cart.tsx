"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/use-cart";
import { toast } from "sonner";
import type { Bundle } from "@/types/bundle";

interface BundleAddToCartProps {
  bundle: Bundle;
}

export function BundleAddToCart({ bundle }: BundleAddToCartProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddBundle = async () => {
    if (loading) return;

    setLoading(true);
    const failed: string[] = [];
    let succeeded = 0;

    for (const item of bundle.bundle_items) {
      try {
        await addToCart(item.variant, undefined, item.quantity);
        succeeded++;
      } catch {
        failed.push(item.item_name || item.variant);
      }
    }

    if (failed.length === 0) {
      setAdded(true);
      toast.success(`${bundle.bundle_name} added to cart!`);
      setTimeout(() => setAdded(false), 3000);
    } else if (succeeded > 0) {
      toast.warning(
        `Added ${succeeded} items. Failed to add: ${failed.join(", ")}`
      );
    } else {
      toast.error("Failed to add bundle to cart. Please try again.");
    }

    setLoading(false);
  };

  return (
    <Button
      size="lg"
      className="w-full gap-2 text-base h-12 rounded-xl transition-all duration-200"
      onClick={handleAddBundle}
      disabled={loading || !bundle.is_active}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Adding to Cart...
        </>
      ) : added ? (
        <>
          <CheckCircle2 className="h-5 w-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          Add Bundle to Cart
        </>
      )}
    </Button>
  );
}
