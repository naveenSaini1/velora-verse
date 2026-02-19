"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Grid3X3, ShoppingCart, Heart, User } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: ROUTES.HOME, icon: Home },
  { label: "Categories", href: ROUTES.CATEGORIES, icon: Grid3X3 },
  { label: "Cart", href: "__cart__", icon: ShoppingCart },
  { label: "Wishlist", href: ROUTES.WISHLIST, icon: Heart },
  { label: "Account", href: ROUTES.PROFILE, icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const cartStore = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const { setCartDrawerOpen } = useUIStore();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const prevCountRef = useRef(0);
  const [badgeBounce, setBadgeBounce] = useState(false);

  const itemCount = cartStore.itemCount();

  // Bounce badge when cart count increases
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setBadgeBounce(true);
      const t = setTimeout(() => setBadgeBounce(false), 400);
      return () => clearTimeout(t);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentY);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Don't show on checkout or auth pages
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-label="Bottom navigation"
    >
      <div className="flex h-16 items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isCart = item.href === "__cart__";
          const active = !isCart && isActive(item.href);

          // Account redirects to login if not logged in
          const href =
            item.label === "Account" && !isLoggedIn
              ? ROUTES.LOGIN
              : item.href;

          if (isCart) {
            return (
              <button
                key={item.label}
                onClick={() => setCartDrawerOpen(true)}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors active:text-primary"
                aria-label="Open cart"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        key="cart-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: badgeBounce ? [1, 1.4, 1] : 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
                      >
                        {itemCount > 99 ? "99+" : itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary"
              )}
            >
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <item.icon
                  className={cn("h-5 w-5", active && "fill-primary/10")}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
