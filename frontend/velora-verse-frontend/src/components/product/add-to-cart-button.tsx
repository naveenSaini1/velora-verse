"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/use-cart";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  itemName: string;
  variant?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  itemName,
  variant,
  quantity = 1,
  disabled = false,
  className,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || disabled) return;

    setLoading(true);
    try {
      await addToCart(itemName, variant, quantity);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      className={cn("gap-2", className)}
      disabled={disabled || loading}
      onClick={handleAddToCart}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingCart className="size-4" />
      )}
      {disabled ? "Out of Stock" : "Add to Cart"}
    </Button>
  );
}
