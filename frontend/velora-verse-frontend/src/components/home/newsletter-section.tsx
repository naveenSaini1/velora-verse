"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/api/newsletter";
import { TextReveal, ScrollReveal } from "@/components/animations";
import { SPRING } from "@/lib/animation";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await subscribeNewsletter(email.trim());
      setMessage(result?.message || "Thanks for subscribing!");
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-xl text-center">
          {/* Bouncy icon entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-60px 0px" }}
            transition={SPRING.bouncy}
            className="inline-flex items-center justify-center h-13 w-13 rounded-full bg-primary/10 mb-5"
          >
            <Mail className="h-6 w-6 text-primary" />
          </motion.div>

          <TextReveal as="h2" splitBy="word" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Stay in the Loop
          </TextReveal>

          <ScrollReveal direction="up" delay={0.2} duration={0.5}>
            <p className="mt-3 text-muted-foreground text-lg">
              Early access to new arrivals, exclusive deals, and curated
              picks — straight to your inbox.
            </p>
          </ScrollReveal>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING.bouncy}
              className="mt-8 relative"
            >
              {/* Celebration particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1],
                    opacity: [1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 60,
                    y: Math.sin((i * Math.PI * 2) / 8) * 60,
                  }}
                  transition={{ duration: 0.6, delay: i * 0.03 }}
                  className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-primary"
                />
              ))}
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <CheckCircle className="h-5 w-5" />
                {message}
              </div>
            </motion.div>
          ) : (
            <ScrollReveal direction="up" delay={0.3} duration={0.5}>
              <form onSubmit={handleSubmit} className="mt-8 flex items-center gap-3 sm:mx-auto sm:max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="h-12 flex-1 rounded-full border border-border bg-card px-5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 disabled:opacity-60"
                  aria-label="Email address"
                />
                <Button type="submit" className="rounded-full px-6 h-12" disabled={loading} aria-label="Subscribe to newsletter">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
                </Button>
              </form>
            </ScrollReveal>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          <ScrollReveal direction="up" delay={0.4} duration={0.4}>
            <p className="mt-4 text-xs text-muted-foreground/60">
              No spam, unsubscribe anytime. We respect your inbox.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
