"use client";

import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Badge } from "@/components/ui/badge";
import { TextReveal, ScrollReveal } from "@/components/animations";

import { ROUTES } from "@/lib/utils/constants";
import type { Promotion } from "@/types/promotion";

interface DealsSectionProps {
  promotions: Promotion[];
}

export function DealsSection({ promotions }: DealsSectionProps) {
  if (promotions.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 isolate">
        <div className="mb-12 flex items-end justify-between gap-4 relative z-10">
          <div>
            <ScrollReveal direction="up" delay={0} duration={0.5}>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                <Tag className="h-3.5 w-3.5" />
                Limited Time
              </div>
            </ScrollReveal>
            <TextReveal as="h2" splitBy="word" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Active Deals
            </TextReveal>
          </div>
          <ScrollReveal direction="right" delay={0.2} duration={0.5}>
            <Link
              href={ROUTES.PROMOTIONS}
              className="group hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View All
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </ScrollReveal>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {promotions.slice(0, 6).map((promo, i) => (
            <ScrollReveal
              key={promo.name}
              direction="left"
              delay={i * 0.1}
              duration={0.6}
              className="shrink-0 snap-start"
            >
              <Link
                href={ROUTES.PROMOTION_DETAIL(promo.name)}
                className="group block"
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative w-[280px] sm:w-[320px] overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-black/[0.06]"
                >
                  {promo.banner_image && (
                    <div className="relative mb-3 aspect-[2/1] w-full overflow-hidden rounded-xl">
                      <FrappeImage
                        src={promo.banner_image}
                        alt={promo.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="320px"
                      />
                    </div>
                  )}

                  <Badge
                    variant="destructive"
                    className="mb-2.5 rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {promo.badge_text
                      ? promo.badge_text
                      : promo.discount_type === "Percentage"
                        ? `${promo.discount_value}% OFF`
                        : `Flat \u20B9${promo.discount_value} OFF`}
                  </Badge>
                  <h3 className="text-base font-semibold leading-snug">
                    {promo.title}
                  </h3>
                  {promo.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {promo.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-200 group-hover:opacity-100">
                    Shop now <ArrowRight className="h-3 w-3" />
                  </div>
                </motion.div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
