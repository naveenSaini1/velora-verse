"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback } from "react";
import { FrappeImage } from "@/components/shared/frappe-image";
import { TextReveal, ScrollReveal, StaggerChildren, staggerItemVariants } from "@/components/animations";
import { ROUTES } from "@/lib/utils/constants";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import type { CategoryTree } from "@/types/product";

interface CategoriesSectionProps {
  categories: CategoryTree[];
}

const CATEGORY_GRADIENTS = [
  "from-rose-400/80 to-orange-300/80",
  "from-amber-400/80 to-yellow-300/80",
  "from-emerald-400/80 to-teal-300/80",
  "from-sky-400/80 to-blue-300/80",
  "from-violet-400/80 to-purple-300/80",
  "from-pink-400/80 to-rose-300/80",
  "from-teal-400/80 to-cyan-300/80",
  "from-orange-400/80 to-amber-300/80",
];

function countChildren(cat: CategoryTree): number {
  return cat.children?.length ?? 0;
}

function CategoryCard({ cat, i }: { cat: CategoryTree; i: number }) {
  const isMobile = useIsMobile();
  const isLarge = i === 0 || i === 3;

  // Mouse-tracking image shift (desktop only)
  const imgX = useMotionValue(0);
  const imgY = useMotionValue(0);
  const springX = useSpring(imgX, { stiffness: 200, damping: 25 });
  const springY = useSpring(imgY, { stiffness: 200, damping: 25 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isMobile) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      imgX.set((e.clientX - cx) * 0.04);
      imgY.set((e.clientY - cy) * 0.04);
    },
    [isMobile, imgX, imgY]
  );

  const handleMouseLeave = useCallback(() => {
    imgX.set(0);
    imgY.set(0);
  }, [imgX, imgY]);

  return (
    <motion.div
      variants={staggerItemVariants}
      className={isLarge ? "row-span-2 sm:row-span-2" : ""}
    >
      <Link
        href={ROUTES.CATEGORY_DETAIL(cat.slug)}
        className="group relative block h-full overflow-hidden rounded-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {cat.image ? (
          <>
            <motion.div
              className="absolute inset-0"
              style={isMobile ? {} : { x: springX, y: springY, scale: 1.05 }}
            >
              <FrappeImage
                src={cat.image}
                alt={cat.category_name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-200" />
          </>
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}`}
          />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                {cat.category_name}
              </h3>
              {countChildren(cat) > 0 && (
                <p className="mt-0.5 text-sm text-white/70">
                  {countChildren(cat)} subcategories
                </p>
              )}
              {(cat.item_count ?? 0) > 0 && (
                <p className="text-sm text-white/70">
                  {cat.item_count} products
                </p>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.15, rotate: 45 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/30"
            >
              <ArrowUpRight className="h-4 w-4 text-white" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 isolate">
        {/* Section header */}
        <div className="mb-14 relative z-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <ScrollReveal direction="up" delay={0} duration={0.4}>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">
                  Explore
                </span>
              </ScrollReveal>
              <TextReveal as="h2" splitBy="word" delay={0.1} className="text-3xl font-bold tracking-tight sm:text-4xl">
                Shop by Category
              </TextReveal>
            </div>
            <ScrollReveal direction="right" delay={0.2} duration={0.5}>
              <Link
                href={ROUTES.CATEGORIES}
                className="group hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                All Categories
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </ScrollReveal>
          </div>
        </div>

        {/* Category grid with staggered reveal — z-[1] keeps cards below z-10 header */}
        <div className="relative z-[1]">
          <StaggerChildren
            staggerDelay={0.06}
            className="grid gap-5 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[260px]"
          >
            {categories.slice(0, 8).map((cat, i) => (
              <CategoryCard key={cat.name} cat={cat} i={i} />
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
