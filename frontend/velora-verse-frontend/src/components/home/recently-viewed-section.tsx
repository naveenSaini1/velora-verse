"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getRecentlyViewed } from "@/lib/api/products";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ProductGrid } from "@/components/product/product-grid";
import { ScrollReveal } from "@/components/animations";
import type { ProductListItem } from "@/types/product";

interface RecentlyViewedSectionProps {
  limit?: number;
}

export function RecentlyViewedSection({ limit = 8 }: RecentlyViewedSectionProps) {
  const { isLoggedIn } = useAuthStore();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoaded(true);
      return;
    }

    getRecentlyViewed()
      .then((items) => setProducts((items || []).slice(0, limit)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [isLoggedIn, limit]);

  // Don't render anything until loaded, and don't show if no products
  if (!loaded || products.length === 0) return null;

  return (
    <section className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="left" duration={0.6}>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recently Viewed</h2>
              <p className="text-sm text-muted-foreground">Pick up where you left off</p>
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15} duration={0.7}>
          <ProductGrid products={products} />
        </ScrollReveal>
      </div>
    </section>
  );
}
