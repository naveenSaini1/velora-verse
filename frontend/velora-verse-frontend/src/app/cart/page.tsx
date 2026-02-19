"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useCart } from "@/lib/hooks/use-cart";
import { ROUTES } from "@/lib/utils/constants";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { CouponInput } from "@/components/cart/coupon-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollReveal } from "@/components/animations";

export default function CartPage() {
  const {
    cart,
    isLoading,
    fetchCart,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
  } = useCart();

  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Sync coupon from cart data
  useEffect(() => {
    if (cart?.coupon_code) {
      setAppliedCoupon(cart.coupon_code);
    }
  }, [cart?.coupon_code]);

  const handleApplyCoupon = (code: string) => {
    setAppliedCoupon(code);
    // Re-fetch cart to get updated totals with coupon applied
    fetchCart();
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(undefined);
    fetchCart();
  };

  // Loading state
  if (isLoading && !cart) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-4">
                <Skeleton className="h-24 w-24 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <ScrollReveal direction="up" duration={0.5}>
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12" />}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet. Browse our products and find something you love."
            actionLabel="Continue Shopping"
            actionHref={ROUTES.PRODUCTS}
          />
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* Page header */}
      <ScrollReveal direction="up" duration={0.4}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Shopping Cart</h1>
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive transition-colors duration-200"
            onClick={clearCart}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        </div>
      </ScrollReveal>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm shadow-black/5 overflow-hidden">
            <div className="divide-y divide-border/50">
              <AnimatePresence initial={false}>
                {cart.items.map((item) => (
                  <motion.div
                    key={item.name || item.variant}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="px-4 sm:px-6"
                  >
                    <CartItem
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Continue shopping link */}
          <div className="mt-4">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <Link href={ROUTES.PRODUCTS}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Sidebar: Summary */}
        <ScrollReveal direction="right" delay={0.15} duration={0.5}>
          <div className="space-y-5">
            {/* Coupon */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm shadow-black/5">
              <h3 className="text-sm font-semibold mb-3">Discount Code</h3>
              <CouponInput
                onApply={handleApplyCoupon}
                appliedCode={appliedCoupon}
                onRemove={handleRemoveCoupon}
                orderTotal={cart.subtotal ?? cart.total}
              />
            </div>

            {/* Order summary */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm shadow-black/5">
              <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
              <CartSummary
                cart={cart}
                showCoupon={false}
                onRemoveCoupon={handleRemoveCoupon}
              />

              <Separator className="my-4" />

              <Button
                className="w-full rounded-xl transition-all duration-200"
                size="lg"
                asChild
              >
                <Link href={ROUTES.CHECKOUT}>
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
