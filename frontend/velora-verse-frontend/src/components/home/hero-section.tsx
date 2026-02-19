"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { FrappeImage } from "@/components/shared/frappe-image";
import {
  TextReveal,
  Parallax,
  ImageReveal,
  MagneticButton,
  CursorGlow,
  ScrollReveal,
} from "@/components/animations";
import { EASE } from "@/lib/animation";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { ROUTES } from "@/lib/utils/constants";
import type { ProductListItem } from "@/types/product";

interface HeroSectionProps {
  heroProducts: ProductListItem[];
}

export function HeroSection({ heroProducts }: HeroSectionProps) {
  const isMobile = useIsMobile();

  const content = (
    <section className="relative min-h-[85svh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-0">
        <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-8 lg:gap-16 min-h-[75svh]">
          {/* Left — text content */}
          <div className="md:col-span-6 lg:col-span-5 relative z-10">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE.smooth }}
              className="mb-5"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                New Arrivals 2026
              </span>
            </motion.div>

            {/* Headline — TextReveal with 3D word animation */}
            <div className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
              <TextReveal
                as="span"
                splitBy="word"
                delay={0.2}
                staggerDelay={0.06}
              >
                Find Something You
              </TextReveal>
              <br />
              <TextReveal
                as="span"
                splitBy="word"
                delay={0.5}
                staggerDelay={0.06}
                className="text-primary"
              >
                Love
              </TextReveal>
            </div>

            {/* Subtext */}
            <ScrollReveal direction="up" delay={0.6} duration={0.6}>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground max-w-md">
                Handpicked pieces that blend quality, craft, and timeless style.
                Every item in our collection tells a story worth owning.
              </p>
            </ScrollReveal>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8, ease: EASE.smooth }}
              className="mt-8 flex flex-wrap gap-3 items-center"
            >
              {isMobile ? (
                <Link
                  href={ROUTES.PRODUCTS}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20"
                >
                  Explore Collection
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <MagneticButton strength={0.15}>
                  <Link
                    href={ROUTES.PRODUCTS}
                    className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20"
                  >
                    Explore Collection
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </MagneticButton>
              )}
              <Link
                href={ROUTES.CATEGORIES}
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-secondary hover:border-secondary"
              >
                Browse Categories
              </Link>
            </motion.div>
          </div>

          {/* Right — image collage with parallax depth */}
          <div className="md:col-span-6 lg:col-span-7 relative">
            {heroProducts.length >= 3 ? (
              <div className="relative h-[55vh] md:h-[70vh] max-h-[650px]">
                {/* Main large image — slow parallax (background feel) */}
                <Parallax
                  speed={isMobile ? 0 : 0.15}
                  disabled={isMobile}
                  className="absolute right-0 top-[5%] w-[58%] h-[78%]"
                >
                  <ImageReveal direction="up" delay={0.3} duration={0.9}>
                    <div className="rounded-3xl overflow-hidden shadow-xl shadow-black/10 h-full">
                      <FrappeImage
                        src={heroProducts[0].image}
                        alt={heroProducts[0].item_name}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 60vw, 40vw"
                      />
                    </div>
                  </ImageReveal>
                </Parallax>

                {/* Secondary image — medium parallax (mid layer) */}
                <Parallax
                  speed={isMobile ? 0 : 0.3}
                  disabled={isMobile}
                  className="absolute left-0 top-[15%] w-[42%] h-[53%] z-10"
                >
                  <ImageReveal direction="left" delay={0.5} duration={0.9}>
                    <div className="rounded-2xl overflow-hidden shadow-lg shadow-black/10 h-full">
                      <FrappeImage
                        src={heroProducts[1].image}
                        alt={heroProducts[1].item_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 42vw, 28vw"
                      />
                    </div>
                  </ImageReveal>
                </Parallax>

                {/* Third image — fast parallax (foreground pop) */}
                <Parallax
                  speed={isMobile ? 0 : 0.45}
                  disabled={isMobile}
                  className="absolute right-[15%] bottom-0 w-[35%] h-[33%] z-20"
                >
                  <ImageReveal direction="up" delay={0.7} duration={0.8}>
                    <div className="rounded-2xl overflow-hidden shadow-md shadow-black/10 h-full">
                      <FrappeImage
                        src={heroProducts[2].image}
                        alt={heroProducts[2].item_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 35vw, 22vw"
                      />
                    </div>
                  </ImageReveal>
                </Parallax>
              </div>
            ) : heroProducts.length > 0 ? (
              <ImageReveal direction="up" delay={0.3}>
                <div className="relative mx-auto w-full max-w-sm">
                  <div className="overflow-hidden rounded-3xl shadow-xl shadow-black/10">
                    <div className="relative aspect-[3/4] w-full">
                      <FrappeImage
                        src={heroProducts[0].image}
                        alt={heroProducts[0].item_name}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 80vw, 380px"
                      />
                    </div>
                  </div>
                </div>
              </ImageReveal>
            ) : (
              /* No products — warm abstract shapes */
              <div className="relative h-[55vh] md:h-[70vh] max-h-[650px]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: EASE.smooth }}
                  className="absolute right-[10%] top-[10%] w-[55%] h-[65%] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/20"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: EASE.smooth }}
                  className="absolute left-[5%] bottom-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-secondary to-primary/5 blur-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // Wrap with cursor glow on desktop only
  if (isMobile) return content;

  return (
    <CursorGlow size={500} opacity={0.08}>
      {content}
    </CursorGlow>
  );
}
