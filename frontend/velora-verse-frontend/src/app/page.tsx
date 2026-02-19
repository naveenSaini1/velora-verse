import type { Metadata } from "next";
import { getFeaturedProducts, getCategoryTree } from "@/lib/api/products";
import { getActivePromotions } from "@/lib/api/promotions";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { DealsSection } from "@/components/home/deals-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { GiftCardSection } from "@/components/home/gift-card-section";
import { RecentlyViewedSection } from "@/components/home/recently-viewed-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import type { ProductListItem, CategoryTree } from "@/types/product";
import type { Promotion } from "@/types/promotion";

export const metadata: Metadata = {
  title: "Velora Verse — Your Friendly Neighborhood Store",
  description:
    "Discover beautifully curated fashion, footwear, accessories and more at Velora Verse. Free shipping on orders above Rs 999.",
  openGraph: {
    title: "Velora Verse — Your Friendly Neighborhood Store",
    description:
      "Discover beautifully curated fashion, footwear, accessories and more at Velora Verse.",
    type: "website",
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  let featuredProducts: ProductListItem[] = [];
  let categories: CategoryTree[] = [];
  let promotions: Promotion[] = [];

  try {
    [featuredProducts, categories, promotions] = await Promise.all([
      getFeaturedProducts(8).catch(() => []),
      getCategoryTree().catch(() => []),
      getActivePromotions().catch(() => []),
    ]);
  } catch {
    // Render page with empty data
  }

  const heroProducts = featuredProducts
    .filter((p) => p.image)
    .slice(0, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veloraverse.com";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Velora Verse",
    url: siteUrl,
    description:
      "Discover beautifully curated fashion, footwear, accessories and more at Velora Verse.",
  };

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Velora Verse",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <HeroSection heroProducts={heroProducts} />
      <TrustBar />
      <DealsSection promotions={promotions} />
      <FeaturedProductsSection products={featuredProducts} />
      <CategoriesSection categories={categories} />
      <GiftCardSection />
      <RecentlyViewedSection />
      <NewsletterSection />
    </div>
  );
}
