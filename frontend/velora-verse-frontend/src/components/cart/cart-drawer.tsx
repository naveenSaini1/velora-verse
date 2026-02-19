"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/use-cart";
import { useUIStore } from "@/lib/stores/ui-store";
import { ROUTES } from "@/lib/utils/constants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Currency } from "@/components/shared/currency";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CartItem } from "./cart-item";

export function CartDrawer() {
  const { cart, isLoading, fetchCart, updateQuantity, removeItem, itemCount } =
    useCart();
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();

  useEffect(() => {
    if (cartDrawerOpen) {
      fetchCart();
    }
  }, [cartDrawerOpen, fetchCart]);

  const hasItems = cart?.items && cart.items.length > 0;

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="size-4 text-primary" />
            </div>
            <SheetTitle className="text-lg">Shopping Cart</SheetTitle>
            {itemCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/10 text-primary text-xs px-2.5"
              >
                {itemCount}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="mt-4" />

        {/* Content */}
        {isLoading && !cart ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : hasItems ? (
          <>
            {/* Items list */}
            <ScrollArea className="flex-1 px-4">
              <div className="divide-y divide-border/50">
                {cart!.items.map((item) => (
                  <CartItem
                    key={item.name || item.variant}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Bottom section */}
            <div className="border-t border-border/50 bg-secondary/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <Currency
                  amount={cart!.subtotal ?? cart!.total}
                  className="text-base font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="flex flex-col gap-2.5">
                <Button
                  asChild
                  onClick={() => setCartDrawerOpen(false)}
                  className="rounded-xl transition-all duration-200"
                >
                  <Link href={ROUTES.CHECKOUT}>
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  onClick={() => setCartDrawerOpen(false)}
                  className="rounded-xl transition-all duration-200"
                >
                  <Link href={ROUTES.CART}>View Cart</Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <div className="rounded-full bg-primary/10 p-5">
              <ShoppingBag className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Your cart is empty</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Add items to your cart to get started.
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              onClick={() => setCartDrawerOpen(false)}
              className="rounded-xl transition-all duration-200"
            >
              <Link href={ROUTES.PRODUCTS}>Continue Shopping</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
