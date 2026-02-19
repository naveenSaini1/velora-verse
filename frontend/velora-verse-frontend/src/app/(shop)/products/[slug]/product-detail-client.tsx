"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageGallery } from "@/components/product/image-gallery";
import { VariantSelector } from "@/components/product/variant-selector";
import { PriceDisplay } from "@/components/product/price-display";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { PincodeChecker } from "@/components/product/pincode-checker";
import { StockNotificationButton } from "@/components/product/stock-notification-button";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/format-date";
import { toStarRating } from "@/lib/utils/rating";
import { recordView } from "@/lib/api/products";
import { getReviews, getReviewSummary, addReview, markReviewHelpful } from "@/lib/api/reviews";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import DOMPurify from "dompurify";
import { Star, Minus, Plus, Loader2, ThumbsUp, Flame } from "lucide-react";
import { toast } from "sonner";
import { ShareButton } from "@/components/product/share-button";
import { ScrollReveal } from "@/components/animations";
import { EASE } from "@/lib/animation";
import type { Product, ProductVariant } from "@/types/product";
import type { Review, ReviewSummary } from "@/types/review";

interface ProductDetailClientProps {
  product: Product;
  initialReviews: { reviews: Review[]; average_rating: number };
  relatedProducts: any[];
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "a", "span", "div",
      "table", "thead", "tbody", "tr", "th", "td", "blockquote",
      "pre", "code", "img", "hr", "sub", "sup",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"],
  });
}

export function ProductDetailClient({
  product,
  initialReviews,
}: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variant_table?.[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariant?.price ?? product.base_price;
  const currentSalePrice = product.sale_price;
  const inStock = selectedVariant ? selectedVariant.is_stock : product.in_stock;
  const maxQuantity = selectedVariant?.quantity ?? 99;
  const stockQuantity = selectedVariant ? selectedVariant.quantity : (product.stock_qty ?? 0);
  const isLowStock = inStock && product.has_variants && stockQuantity > 0 && stockQuantity <= 5;
  const variantName = selectedVariant?.name;
  const starRating = toStarRating(product.average_rating);

  const sanitizedDescription = useMemo(() => {
    if (!product.description) return "";
    return sanitizeHtml(product.description);
  }, [product.description]);

  // Record view on mount
  useEffect(() => {
    recordView(product.slug).catch(() => {});
  }, [product.slug]);

  // Get images - variant-specific if available, otherwise product images
  const images =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : product.images;

  return (
    <div>
      {/* Product detail layout */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Image gallery */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE.smooth }}
        >
          <ImageGallery images={images} />
        </motion.div>

        {/* Right: Product info */}
        <motion.div
          className="flex flex-col gap-5"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE.smooth }}
        >
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            {!!product.is_featured && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Featured
              </Badge>
            )}
            {!inStock && <Badge variant="destructive">Out of Stock</Badge>}
            {product.sale_price != null && product.sale_price < product.base_price && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                Sale
              </Badge>
            )}
          </div>

          {/* Product name */}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.item_name}
          </h1>

          {/* Rating + review count */}
          {(product.review_count ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={starRating} size={18} showValue />
              <span className="text-sm text-muted-foreground">
                ({product.review_count} {product.review_count === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Price */}
          <PriceDisplay
            basePrice={currentPrice}
            salePrice={currentSalePrice}
            className="text-xl"
          />

          {/* Short description */}
          {sanitizedDescription && (
            <div
              className="prose prose-sm max-w-none text-muted-foreground line-clamp-3"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          )}

          <Separator />

          {/* Variant selector */}
          {!!product.has_variants && product.variant_table && product.variant_table.length > 0 && (
            <VariantSelector
              variants={product.variant_table}
              selectedVariant={selectedVariant}
              onSelect={setSelectedVariant}
            />
          )}

          {/* Low stock warning */}
          <AnimatePresence>
            {isLowStock && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/50"
              >
                <Flame className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Only {stockQuantity} left in stock — order soon!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quantity selector */}
          {inStock && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={quantity >= maxQuantity}
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Add to cart + wishlist (or stock notification) */}
          {inStock ? (
            <div className="flex items-center gap-3">
              <AddToCartButton
                itemName={product.name}
                variant={variantName}
                quantity={quantity}
                disabled={!inStock}
                className="flex-1 h-11 text-base rounded-full"
              />
              <WishlistButton
                itemName={variantName || product.name}
                className="h-11 w-11"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <AddToCartButton
                  itemName={product.name}
                  variant={variantName}
                  disabled
                  className="flex-1 h-11 text-base rounded-full"
                />
                <WishlistButton
                  itemName={variantName || product.name}
                  className="h-11 w-11"
                />
              </div>
              <StockNotificationButton
                itemName={product.name}
                variantName={variantName}
              />
            </div>
          )}

          <Separator />

          {/* Pincode checker */}
          <PincodeChecker />

          {/* SKU + Category info */}
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {product.sku && (
                <p>
                  SKU: <span className="font-medium text-foreground">{product.sku}</span>
                </p>
              )}
              {selectedVariant?.sku && (
                <p>
                  Variant SKU:{" "}
                  <span className="font-medium text-foreground">
                    {selectedVariant.sku}
                  </span>
                </p>
              )}
              {(product.categories?.length ?? 0) > 0 && (
                <p>
                  Category:{" "}
                  {product.categories.map((c) => c.category_name).join(", ")}
                </p>
              )}
            </div>

            {/* Share button */}
            <ShareButton title={product.item_name} path={`/products/${product.slug}`} />
          </div>
        </motion.div>
      </div>

      {/* Tabs: Description, Reviews, Specifications */}
      <ScrollReveal direction="up" delay={0.3} duration={0.5}>
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({product.review_count ?? 0})
            </TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            {sanitizedDescription ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            ) : (
              <p className="text-muted-foreground">
                No description available for this product.
              </p>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewSection
              productName={product.name}
              initialReviews={initialReviews.reviews ?? []}
            />
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {product.type && (
                <SpecRow label="Product Type" value={product.type} />
              )}
              {product.sku && <SpecRow label="SKU" value={product.sku} />}
              {product.hsn_code && (
                <SpecRow label="HSN Code" value={product.hsn_code} />
              )}
              {selectedVariant?.weight != null && (
                <SpecRow
                  label="Weight"
                  value={`${selectedVariant.weight} kg`}
                />
              )}
              {selectedVariant?.barcode && (
                <SpecRow label="Barcode" value={selectedVariant.barcode} />
              )}
              {!!product.has_variants &&
                selectedVariant?.variant_values?.map((vv) => (
                  <SpecRow key={vv.type} label={vv.type} value={vv.value} />
                ))}
            </div>
            {!product.type && !product.sku && !product.hsn_code && !selectedVariant && (
              <p className="text-muted-foreground">
                No specifications available for this product.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </ScrollReveal>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium">{value}</span>
    </div>
  );
}

function ReviewSection({
  productName,
  initialReviews,
}: {
  productName: string;
  initialReviews: Review[];
}) {
  const { isLoggedIn } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest" | "helpful">("newest");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialReviews.length >= 10);

  const fetchReviews = useCallback(
    async (sort: string, offset = 0) => {
      const data = await getReviews({
        item: productName,
        limit: 10,
        offset,
        sort_by: sort as "newest" | "oldest" | "highest" | "lowest" | "helpful",
      });
      const fetched = data.reviews ?? [];
      if (offset === 0) {
        setReviews(fetched);
      } else {
        setReviews((prev) => [...prev, ...fetched]);
      }
      setHasMore(fetched.length >= 10);
    },
    [productName]
  );

  useEffect(() => {
    getReviewSummary(productName).then(setSummary).catch(() => {});
  }, [productName]);

  const handleSortChange = async (newSort: typeof sortBy) => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    setLoading(true);
    try {
      await fetchReviews(newSort);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchReviews(sortBy, reviews.length);
    } catch {
      toast.error("Failed to load more reviews");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReviewAdded = async () => {
    try {
      await fetchReviews(sortBy);
      const s = await getReviewSummary(productName);
      setSummary(s);
    } catch {
      // ignore
    }
  };

  const sortOptions = [
    { value: "newest" as const, label: "Newest" },
    { value: "highest" as const, label: "Highest" },
    { value: "lowest" as const, label: "Lowest" },
    { value: "helpful" as const, label: "Most Helpful" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Rating Summary */}
      {summary && summary.review_count > 0 && (
        <RatingSummary summary={summary} />
      )}

      {/* Sort chips */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground mr-1">Sort:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Add Review Form */}
      {isLoggedIn && (
        <AddReviewForm productName={productName} onSuccess={handleReviewAdded} />
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {reviews.map((review) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Reviews"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No reviews yet.{" "}
          {isLoggedIn
            ? "Be the first to review this product!"
            : "Log in to write a review."}
        </p>
      )}
    </div>
  );
}

function RatingSummary({ summary }: { summary: ReviewSummary }) {
  const starRating = toStarRating(summary.average_rating);
  const distribution = summary.rating_distribution;
  const maxCount = Math.max(...distribution, 1);

  return (
    <div className="flex flex-col sm:flex-row gap-6 rounded-xl border p-5">
      <div className="flex flex-col items-center justify-center gap-1 sm:min-w-[120px]">
        <span className="text-4xl font-bold">{starRating.toFixed(1)}</span>
        <StarRating rating={starRating} size={16} />
        <span className="text-sm text-muted-foreground">
          {summary.review_count}{" "}
          {summary.review_count === 1 ? "review" : "reviews"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star - 1] ?? 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-3">
                {star}
              </span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    duration: 0.6,
                    delay: (5 - star) * 0.08,
                    ease: EASE.smooth,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const starRating = toStarRating(review.rating);
  const { isLoggedIn } = useAuthStore();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count ?? 0);
  const [marked, setMarked] = useState(false);

  const handleHelpful = async () => {
    if (marked) return;
    setMarked(true);
    setHelpfulCount((c) => c + 1);
    try {
      const result = await markReviewHelpful(review.name);
      setHelpfulCount(result.helpful_count);
    } catch {
      setMarked(false);
      setHelpfulCount((c) => c - 1);
      toast.error("Failed to mark as helpful");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarRating rating={starRating} size={14} />
          {!!review.is_verified && (
            <Badge variant="secondary" className="text-xs">
              Verified Purchase
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(review.creation)}
        </span>
      </div>

      {review.review_title && (
        <h4 className="font-medium">{review.review_title}</h4>
      )}

      {review.review_text && (
        <p className="text-sm text-muted-foreground">{review.review_text}</p>
      )}

      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">
          By {review.user_name || review.user}
        </p>
        {isLoggedIn && (
          <button
            onClick={handleHelpful}
            disabled={marked}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              marked
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ThumbsUp
              className={cn("h-3.5 w-3.5", marked && "fill-current")}
            />
            Helpful{helpfulCount > 0 ? ` (${helpfulCount})` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function AddReviewForm({
  productName,
  onSuccess,
}: {
  productName: string;
  onSuccess: () => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const displayRating = hoverRating || rating;
  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await addReview({
        item: productName,
        rating: rating / 5,
        review_title: title || undefined,
        review_text: comment || undefined,
      });
      toast.success("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setComment("");
      await onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border p-5"
    >
      <h3 className="font-semibold">Write a Review</h3>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Rating</Label>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  star <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
          {displayRating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {ratingLabels[displayRating]}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-title" className="text-sm">
          Title (optional)
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="review-comment" className="text-sm">
            Review (optional)
          </Label>
          {comment.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {comment.length}/500
            </span>
          )}
        </div>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={4}
          maxLength={500}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || rating === 0}
        className="rounded-full"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
