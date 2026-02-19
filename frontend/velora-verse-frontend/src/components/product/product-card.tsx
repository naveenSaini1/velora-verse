"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Eye, Flame } from "lucide-react";
import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FrappeImage } from "@/components/shared/frappe-image";
import { StarRating } from "@/components/shared/star-rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Currency } from "@/components/shared/currency";
import { useCart } from "@/lib/hooks/use-cart";
import { useUIStore } from "@/lib/stores/ui-store";
import { ROUTES } from "@/lib/utils/constants";
import { toStarRating } from "@/lib/utils/rating";
import { SPRING } from "@/lib/animation";
import type { ProductListItem } from "@/types/product";

interface ProductCardProps {
  product: ProductListItem;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const setQuickViewSlug = useUIStore((s) => s.setQuickViewSlug);
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasDiscount =
    product.sale_price != null && product.sale_price < product.base_price;
  const percentOff = hasDiscount
    ? Math.round(
        ((product.base_price - product.sale_price!) / product.base_price) * 100
      )
    : 0;
  const isLowStock =
    product.in_stock &&
    product.has_variants &&
    product.stock_qty != null &&
    product.stock_qty > 0 &&
    product.stock_qty <= 5;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || !product.in_stock) return;
    setAdding(true);
    try {
      await addToCart(product.name, undefined, 1);
    } finally {
      setAdding(false);
    }
  };

  const handleViewOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(ROUTES.PRODUCT_DETAIL(product.slug));
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewSlug(product.slug);
  };

  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow duration-300 hover:shadow-xl hover:shadow-black/[0.08]"
      whileHover={{ y: -4 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Image area — relative wrapper for overlays */}
      <div className="relative">
        <Link
          href={ROUTES.PRODUCT_DETAIL(product.slug)}
          className="relative block aspect-[3/4] overflow-hidden bg-secondary/50"
        >
          <FrappeImage
            src={product.image}
            alt={product.item_name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />

          {/* Featured badge */}
          {!!product.is_featured && (
            <span className="absolute top-3 left-3 z-10 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground">
              Featured
            </span>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <span className="absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-destructive text-white">
              -{percentOff}%
            </span>
          )}
        </Link>

        {/* Wishlist button — over image, outside Link */}
        <div className="absolute top-3 right-3 z-10 transition-all duration-200 md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0">
          <WishlistButton itemName={product.name} />
        </div>

        {/* Quick action buttons on hover */}
        <AnimatePresence>
          {hovered && !!product.in_stock && !product.has_variants && (
            <motion.button
              key="quick-add"
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={SPRING.snappy}
              onClick={handleQuickAdd}
              disabled={adding}
              aria-label={`Add ${product.item_name} to cart`}
              className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {adding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </motion.button>
          )}
          {hovered && (
            <motion.button
              key="quick-view"
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={SPRING.snappy}
              onClick={handleQuickView}
              aria-label={`Quick view ${product.item_name}`}
              className="absolute bottom-3 left-3 z-10 flex size-10 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm shadow-md hover:bg-card cursor-pointer"
            >
              <Eye className="size-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-2 p-4">
        {/* Category */}
        {product.category && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {product.category}
          </span>
        )}

        {/* Product name */}
        <Link
          href={ROUTES.PRODUCT_DETAIL(product.slug)}
          className="text-[13px] sm:text-sm font-medium leading-snug line-clamp-2 text-foreground transition-colors duration-200 hover:text-primary"
        >
          {product.item_name}
        </Link>

        {/* Rating */}
        {product.average_rating > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating
              rating={toStarRating(product.average_rating)}
              size={12}
            />
            <span className="text-[10px] text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {hasDiscount ? (
            <>
              <Currency
                amount={product.sale_price!}
                className="text-base font-bold text-foreground"
              />
              <Currency
                amount={product.base_price}
                className="text-xs text-muted-foreground/50 line-through"
              />
            </>
          ) : (
            <Currency
              amount={product.base_price}
              className="text-base font-bold text-foreground"
            />
          )}
        </div>

        {/* Stock status */}
        {!product.in_stock && (
          <span className="text-[11px] font-medium text-destructive">
            Out of stock
          </span>
        )}
        {isLowStock && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Flame className="size-3" />
            Only {product.stock_qty} left!
          </span>
        )}
      </div>
    </motion.article>
  );
});
