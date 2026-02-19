"use client";

import { useCallback } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useUIStore } from "@/lib/stores/ui-store";
import * as cartApi from "@/lib/api/cart";
import { toast } from "sonner";

export function useCart() {
  const { cart, isLoading, setCart, setLoading } = useCartStore();
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [setCart, setLoading]);

  const addToCart = useCallback(
    async (itemOrVariant: string, variant?: string, quantity?: number) => {
      try {
        setLoading(true);
        // If variant is provided, use it; otherwise itemOrVariant IS the variant
        const variantId = variant || itemOrVariant;
        await cartApi.addToCart({ variant: variantId, quantity });
        // Re-fetch full cart after mutation (add_to_cart returns partial data)
        const fullCart = await cartApi.getCart();
        setCart(fullCart);
        setCartDrawerOpen(true);
        toast.success("Added to cart");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add to cart");
      } finally {
        setLoading(false);
      }
    },
    [setCart, setLoading, setCartDrawerOpen]
  );

  const updateQuantity = useCallback(
    async (variant: string, quantity: number) => {
      try {
        await cartApi.updateCartQuantity({ variant, quantity });
        const fullCart = await cartApi.getCart();
        setCart(fullCart);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update quantity");
      }
    },
    [setCart]
  );

  const removeItem = useCallback(
    async (variant: string) => {
      try {
        await cartApi.removeFromCart({ variant });
        const fullCart = await cartApi.getCart();
        setCart(fullCart);
        toast.success("Removed from cart");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove item");
      }
    },
    [setCart]
  );

  const clearCartItems = useCallback(async () => {
    try {
      await cartApi.clearCart();
      const fullCart = await cartApi.getCart();
      setCart(fullCart);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear cart");
    }
  }, [setCart]);

  // Derive item count from items array since backend doesn't return item_count
  const itemCount = cart?.items
    ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  return {
    cart,
    isLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart: clearCartItems,
    itemCount,
  };
}
