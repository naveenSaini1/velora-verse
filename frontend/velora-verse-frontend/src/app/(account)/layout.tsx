"use client";

import { motion } from "framer-motion";
import { AccountSidebar } from "@/components/layout/account-sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] md:gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar: pill-style tabs on mobile, card sidebar on desktop */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <AccountSidebar />
        </motion.div>

        {/* Page content */}
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
