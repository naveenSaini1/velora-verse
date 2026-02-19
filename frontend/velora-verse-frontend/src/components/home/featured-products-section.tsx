"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/product/product-grid";
import { TextReveal, ScrollReveal } from "@/components/animations";
import { EASE, VIEWPORT } from "@/lib/animation";
import { ROUTES } from "@/lib/utils/constants";
import type { ProductListItem } from "@/types/product";

interface FeaturedProductsSectionProps {
  products: ProductListItem[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="relative py-20 sm:py-24">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative isolate">
        {/* Section header — z-10 keeps it above product cards (motion transforms create stacking contexts) */}
        <div className="mb-14 relative z-10">
          {/* Animated divider lines */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={VIEWPORT.default}
              transition={{ duration: 0.8, ease: EASE.premium }}
              className="h-px flex-1 bg-gradient-to-r from-transparent to-border origin-right"
            />
            <ScrollReveal direction="up" delay={0.1} duration={0.4}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Curated
              </div>
            </ScrollReveal>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={VIEWPORT.default}
              transition={{ duration: 0.8, ease: EASE.premium }}
              className="h-px flex-1 bg-gradient-to-l from-transparent to-border origin-left"
            />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <TextReveal as="h2" splitBy="word" delay={0.1} className="text-3xl font-bold tracking-tight sm:text-4xl">
                Handpicked for You
              </TextReveal>
              <ScrollReveal direction="up" delay={0.3} duration={0.5}>
                <p className="mt-2 text-muted-foreground max-w-md">
                  Pieces we believe in — selected for their craft, quality, and lasting appeal.
                </p>
              </ScrollReveal>
            </div>
            <ScrollReveal direction="right" delay={0.3} duration={0.5}>
              <Link
                href={`${ROUTES.PRODUCTS}?is_featured=true`}
                className="group hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View All
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </ScrollReveal>
          </div>
        </div>

        {/* Product grid — z-[1] keeps cards below z-10 header (motion transforms create stacking contexts) */}
        <div className="relative z-[1]">
          <ScrollReveal direction="up" delay={0.2} duration={0.7}>
            <ProductGrid products={products} />
          </ScrollReveal>
        </div>

        {/* Mobile view all link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`${ROUTES.PRODUCTS}?is_featured=true`}
            className="group inline-flex items-center gap-2 text-sm font-medium"
          >
            View All Products
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
