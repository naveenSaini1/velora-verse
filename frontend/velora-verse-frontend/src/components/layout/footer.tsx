"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerChildren, staggerItemVariants } from "@/components/animations";
import { SPRING, VIEWPORT } from "@/lib/animation";
import { ROUTES } from "@/lib/utils/constants";

const FOOTER_LINKS = {
  shop: [
    { label: "All Products", href: ROUTES.PRODUCTS },
    { label: "Categories", href: ROUTES.CATEGORIES },
    { label: "Bundles", href: ROUTES.BUNDLES },
    { label: "Promotions", href: ROUTES.PROMOTIONS },
    { label: "Gift Cards", href: ROUTES.GIFT_CARDS },
  ],
  company: [
    { label: "About Us", href: ROUTES.ABOUT },
    { label: "Contact", href: ROUTES.CONTACT },
    { label: "FAQ", href: ROUTES.FAQ },
  ],
  account: [
    { label: "Profile", href: ROUTES.PROFILE },
    { label: "Orders", href: ROUTES.ORDERS },
    { label: "Wishlist", href: ROUTES.WISHLIST },
    { label: "Returns", href: ROUTES.RETURNS },
  ],
  legal: [
    { label: "Privacy Policy", href: ROUTES.PRIVACY_POLICY },
    { label: "Terms & Conditions", href: ROUTES.TERMS },
    { label: "Shipping Info", href: ROUTES.SHIPPING_INFO },
    { label: "Returns Policy", href: ROUTES.RETURNS_POLICY },
  ],
} as const;

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/veloraverse_?igsh=MW1lOGZ3Mzl5M3lhMw==",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "https://x.com/veloraverse",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/veloraverse",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Meesho",
    href: "https://meesho.com/puloka-premium-leather-case-compatible-with-iphone-17-logo-cut--soft-inner-cloth-lining--shock---resistant-luxury-cover--heavy-protection--luxury-finish/p/b1fo9y?_ms=1.2",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
      </svg>
    ),
  },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FooterProps {
  storeName?: string;
}

export function Footer({ storeName = "Velora Verse" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container mx-auto px-4 pt-16 pb-8">
        {/* Brand + columns */}
        <StaggerChildren
          staggerDelay={0.08}
          className="grid grid-cols-2 gap-10 lg:grid-cols-12 mb-12"
        >
          {/* Brand section */}
          <motion.div variants={staggerItemVariants} className="col-span-2 lg:col-span-3">
            <Link
              href={ROUTES.HOME}
              className="inline-block text-2xl font-bold tracking-tight transition-colors hover:text-primary"
            >
              {storeName}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Curated collections that bring joy. We believe in quality,
              comfort, and things that make you smile.
            </p>

            {/* Social links — staggered scale-in */}
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={link.label}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={VIEWPORT.lazy}
                  transition={{
                    ...SPRING.bouncy,
                    delay: 0.3 + i * 0.08,
                  }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          <motion.div variants={staggerItemVariants} className="lg:col-span-2 lg:col-start-5">
            <FooterColumn title="Shop" links={FOOTER_LINKS.shop} />
          </motion.div>

          <motion.div variants={staggerItemVariants} className="lg:col-span-2">
            <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          </motion.div>

          <motion.div variants={staggerItemVariants} className="lg:col-span-2">
            <FooterColumn title="Account" links={FOOTER_LINKS.account} />
          </motion.div>

          <motion.div variants={staggerItemVariants} className="lg:col-span-2 lg:col-start-11">
            <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
          </motion.div>
        </StaggerChildren>

        {/* Payment icons + copyright */}
        <ScrollReveal direction="up" delay={0.2} duration={0.5}>
          <div className="border-t border-border pt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} {storeName}. All rights reserved.
            </p>

            {/* Payment method badges */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/60 mr-1">We accept</span>
              {["Visa", "Mastercard", "UPI", "RuPay"].map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center rounded-md border border-border/60 bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
