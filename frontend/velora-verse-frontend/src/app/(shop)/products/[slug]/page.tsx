import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductDetail, getRelatedProducts } from "@/lib/api/products";
import { getReviews } from "@/lib/api/reviews";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { ROUTES } from "@/lib/utils/constants";
import { resolveImageUrl } from "@/lib/utils/image-url";
import type { Product, ProductListItem } from "@/types/product";
import type { Review } from "@/types/review";
import { RecentlyViewedSection } from "@/components/home/recently-viewed-section";
import { ScrollReveal } from "@/components/animations";
import { ProductDetailClient } from "./product-detail-client";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductDetail(slug);
    const primaryImage = product.images.find((img) => img.is_primary) ?? product.images[0];
    const imageUrl = primaryImage ? resolveImageUrl(primaryImage.image) : undefined;

    return {
      title: product.meta_title || product.item_name,
      description:
        product.meta_description ||
        product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
        `Buy ${product.item_name} at Velora Verse`,
      openGraph: {
        title: product.meta_title || product.item_name,
        description:
          product.meta_description ||
          product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
          `Buy ${product.item_name} at Velora Verse`,
        images: imageUrl ? [{ url: imageUrl }] : undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  let product: Product;
  try {
    product = await getProductDetail(slug);
  } catch {
    notFound();
  }

  let reviewData: { reviews: Review[]; average_rating: number } = {
    reviews: [],
    average_rating: 0,
  };
  let relatedProducts: ProductListItem[] = [];

  try {
    [reviewData, relatedProducts] = await Promise.all([
      getReviews({ item: product.name, limit: 10 }).catch(() => reviewData),
      getRelatedProducts(slug, 8).catch(() => []),
    ]);
  } catch {
    // Continue with defaults
  }

  // Build breadcrumb from category
  const primaryCategory = product.categories.find((c) => c.is_primary) ?? product.categories[0];
  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: "Home", href: ROUTES.HOME },
    { label: "Products", href: ROUTES.PRODUCTS },
  ];
  if (primaryCategory) {
    breadcrumbItems.push({
      label: primaryCategory.category_name,
      href: `${ROUTES.PRODUCTS}?category=${primaryCategory.category}`,
    });
  }
  breadcrumbItems.push({ label: product.item_name });

  // Build primary image URL for JSON-LD
  const primaryImage =
    product.images.find((img) => img.is_primary) ?? product.images[0];
  const imageUrl = primaryImage
    ? resolveImageUrl(primaryImage.image)
    : undefined;

  // JSON-LD Product structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.item_name,
    description: product.description?.replace(/<[^>]*>/g, "") || undefined,
    image: imageUrl,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.sale_price ?? product.base_price,
      priceCurrency: "INR",
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: (product.average_rating * 5).toFixed(1),
            bestRating: "5",
            reviewCount: product.review_count,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <ProductDetailClient
          product={product}
          initialReviews={reviewData}
          relatedProducts={relatedProducts}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <ScrollReveal direction="up" duration={0.5}>
              <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.1} duration={0.6}>
              <Suspense fallback={<ProductGridSkeleton count={4} />}>
                <ProductGrid products={relatedProducts} />
              </Suspense>
            </ScrollReveal>
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewedSection limit={4} />
      </div>
    </>
  );
}
