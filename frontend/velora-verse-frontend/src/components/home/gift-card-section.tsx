"use client";

import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { TextReveal, ScrollReveal, CursorGlow, MagneticButton } from "@/components/animations";
import { EASE } from "@/lib/animation";
import { useIsMobile } from "@/lib/hooks/use-media-query";

export function GiftCardSection() {
  const isMobile = useIsMobile();

  const content = (
    <section className="relative py-24">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary to-accent/30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left — content */}
          <ScrollReveal direction="left" duration={0.7}>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Gift className="h-3.5 w-3.5" />
                Perfect for any occasion
              </span>
              <div className="mt-5">
                <TextReveal as="h2" splitBy="word" delay={0.2} className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Give the Gift of Choice
                </TextReveal>
              </div>
              <ScrollReveal direction="up" delay={0.4} duration={0.5}>
                <p className="mt-4 max-w-md text-lg text-muted-foreground leading-relaxed">
                  Let them pick exactly what they love. Velora Verse gift cards come
                  in any amount and never expire.
                </p>
              </ScrollReveal>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px 0px" }}
                transition={{ duration: 0.5, delay: 0.6, ease: EASE.smooth }}
                className="mt-8"
              >
                {isMobile ? (
                  <Link
                    href="/gift-cards"
                    className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20"
                  >
                    Shop Gift Cards
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <MagneticButton strength={0.15}>
                    <Link
                      href="/gift-cards"
                      className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20"
                    >
                      Shop Gift Cards
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </MagneticButton>
                )}
              </motion.div>
            </div>
          </ScrollReveal>

          {/* Right — decorative gift card visual */}
          <ScrollReveal direction="right" delay={0.15} duration={0.7}>
            <div className="relative flex items-center justify-center">
              {/* Floating stacked cards */}
              <motion.div
                animate={{
                  rotate: [6, 9, 6],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute h-52 w-76 rounded-3xl bg-primary/15"
              />
              <motion.div
                animate={{
                  rotate: [-3, -5, -3],
                  y: [0, 6, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute h-52 w-76 rounded-3xl bg-primary/8"
              />
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative h-52 w-76 rounded-3xl bg-card border border-border shadow-lg flex flex-col justify-between p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Velora Verse
                  </span>
                  <Gift className="h-5 w-5 text-primary/40" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Gift Card
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {"\u20B9"}2,500
                  </p>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );

  if (isMobile) return content;

  return (
    <CursorGlow size={350} opacity={0.1}>
      {content}
    </CursorGlow>
  );
}
