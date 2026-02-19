"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getWishlist, removeFromWishlist } from "@/lib/api/wishlist";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";

import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WishlistItem {
  variant: string;
  variant_title: string;
  item_name: string;
  slug: string;
  price: number;
  in_stock: boolean;
  image: string | null;
  added_on: string | null;
}

export default function WishlistPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { addToCart } = useCart();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchWishlist();
  }, [authLoading]);

  async function fetchWishlist() {
    try {
      setLoading(true);
      const data = await getWishlist();
      setItems(data.items ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load wishlist");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(variant: string) {
    setRemovingId(variant);
    try {
      await removeFromWishlist({ variant });
      setItems((prev) => prev.filter((i) => i.variant !== variant));
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove item"
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleMoveToCart(item: WishlistItem) {
    setAddingId(item.variant);
    try {
      await addToCart(item.variant, undefined, 1);
      await removeFromWishlist({ variant: item.variant });
      setItems((prev) => prev.filter((i) => i.variant !== item.variant));
      toast.success("Moved to cart");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add to cart"
      );
    } finally {
      setAddingId(null);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
        <p className="text-muted-foreground">
          {items.length > 0
            ? `${items.length} item${items.length !== 1 ? "s" : ""} saved for later`
            : "Items you've saved for later"}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="Your wishlist is empty"
          description="Save products you love and come back to them anytime"
          actionLabel="Browse Products"
          actionHref={ROUTES.PRODUCTS}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.variant}
              className="group overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-md"
            >
              <div className="flex gap-4 p-4">
                {/* Image */}
                <Link
                  href={item.slug ? ROUTES.PRODUCT_DETAIL(item.slug) : "#"}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary/50"
                >
                  <FrappeImage
                    src={item.image}
                    alt={item.item_name || item.variant_title || "Product"}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={item.slug ? ROUTES.PRODUCT_DETAIL(item.slug) : "#"}
                      className="text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors"
                    >
                      {item.item_name || item.variant_title || "Product"}
                    </Link>
                    {item.variant_title &&
                      item.variant_title !== item.item_name && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {item.variant_title}
                        </p>
                      )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Currency
                      amount={item.price}
                      className="text-base font-bold"
                    />
                    {!item.in_stock && (
                      <span className="text-[11px] font-medium text-destructive">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center border-t px-4 py-2.5 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9"
                  disabled={
                    !item.in_stock ||
                    addingId === item.variant ||
                    removingId === item.variant
                  }
                  onClick={() => handleMoveToCart(item)}
                >
                  {addingId === item.variant ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {item.in_stock ? "Move to Cart" : "Out of Stock"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs h-9 text-muted-foreground hover:text-destructive"
                  disabled={removingId === item.variant}
                  onClick={() => handleRemove(item.variant)}
                >
                  {removingId === item.variant ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
