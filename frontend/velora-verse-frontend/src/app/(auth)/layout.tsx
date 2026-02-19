"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] md:min-h-[calc(100dvh-4rem)] flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/40 to-primary/5 px-4 py-6 sm:py-12">
      {/* Logo / brand link */}
      <Link
        href={ROUTES.HOME}
        className="mb-4 sm:mb-8 flex items-center gap-2.5 text-foreground transition-opacity duration-200 hover:opacity-80"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight">Velora Verse</span>
      </Link>

      {/* Auth card area */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>

      {/* Footer */}
      <p className="mt-4 sm:mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Velora Verse. All rights reserved.
      </p>
    </div>
  );
}
