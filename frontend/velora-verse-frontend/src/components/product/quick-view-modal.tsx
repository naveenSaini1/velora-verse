"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageGallery } from "@/components/product/image-gallery";
import { VariantSelector } from "@/components/product/variant-selector";
import { PriceDisplay } from "@/components/product/price-display";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowRight, Minus, Plus, Flame } from "lucide-react";
import { getProductDetail } from "@/lib/api/products";
import { useUIStore } from "@/lib/stores/ui-store";
import { toStarRating } from "@/lib/utils/rating";
import { ROUTES } from "@/lib/utils/constants";
import type { Product, ProductVariant } from "@/types/product";

export function QuickViewModal() {
  const quickViewSlug = useUIStore((s) => s.quickViewSlug);
  const setQuickViewSlug = useUIStore((s) => s.setQuickViewSlug);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const open = !!quickViewSlug;

  useEffect(() => {
    if (!quickViewSlug) {
      setProduct(null);
      setSelectedVariant(null);
      setQuantity(1);
      return;
    }

    setLoading(true);
    getProductDetail(quickViewSlug)
      .then((p) => {
        setProduct(p);
        setSelectedVariant(p.variant_table?.[0] ?? null);
      })
      .catch(() => {
        setQuickViewSlug(null);
      })
      .finally(() => setLoading(false));
  }, [quickViewSlug, setQuickViewSlug]);

  const handleClose = () => setQuickViewSlug(null);

  const currentPrice = selectedVariant?.price ?? product?.base_price ?? 0;
  const currentSalePrice = product?.sale_price;
  const inStock = selectedVariant
    ? selectedVariant.is_stock
    : (product?.in_stock ?? false);
  const maxQuantity = selectedVariant?.quantity ?? 99;
  const stockQuantity = selectedVariant ? selectedVariant.quantity : (product?.stock_qty ?? 0);
  const isLowStock = inStock && !!product?.has_variants && stockQuantity > 0 && stockQuantity <= 5;
  const variantName = selectedVariant?.name;
  const images =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : (product?.images ?? []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        {loading || !product ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-[1.1fr_1fr] max-h-[90vh] overflow-y-auto">
            {/* Left: Image gallery */}
            <div className="relative aspect-square md:aspect-auto md:min-h-[450px] bg-secondary/30">
              <ImageGallery images={images} />
            </div>

            {/* Right: Product info */}
            <div className="flex flex-col gap-6 p-7 md:p-9 overflow-y-auto">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {!!product.is_featured && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Featured
                    </Badge>
                  )}
                  {!inStock && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                  {product.sale_price != null &&
                    product.sale_price < product.base_price && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        Sale
                      </Badge>
                    )}
                </div>

                <h2 className="text-2xl font-bold tracking-tight leading-tight">
                  {product.item_name}
                </h2>

                {(product.review_count ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating
                      rating={toStarRating(product.average_rating)}
                      size={14}
                      showValue
                    />
                    <span className="text-xs text-muted-foreground">
                      ({product.review_count}{" "}
                      {product.review_count === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>

              <PriceDisplay
                basePrice={currentPrice}
                salePrice={currentSalePrice}
                className="text-xl"
              />

              <Separator />

              {!!product.has_variants &&
                product.variant_table &&
                product.variant_table.length > 0 && (
                  <VariantSelector
                    variants={product.variant_table}
                    selectedVariant={selectedVariant}
                    onSelect={setSelectedVariant}
                  />
                )}

              {isLowStock && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Flame className="h-3.5 w-3.5" />
                  Only {stockQuantity} left in stock!
                </div>
              )}

              {inStock && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Qty:</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    disabled={quantity >= maxQuantity}
                    onClick={() =>
                      setQuantity(Math.min(maxQuantity, quantity + 1))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <AddToCartButton
                  itemName={product.name}
                  variant={variantName}
                  quantity={quantity}
                  disabled={!inStock}
                  className="flex-1 h-11 rounded-full"
                />
                <WishlistButton
                  itemName={variantName || product.name}
                  className="h-11 w-11"
                />
              </div>

              <Button
                variant="ghost"
                asChild
                className="w-full rounded-full"
                onClick={handleClose}
              >
                <Link href={ROUTES.PRODUCT_DETAIL(product.slug)}>
                  View Full Details
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
