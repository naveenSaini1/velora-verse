"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  Menu,
  LogOut,
  Package,
  UserCircle,
} from "lucide-react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { getUnreadCount } from "@/lib/api/notifications";
import { ROUTES } from "@/lib/utils/constants";
import { resolveImageUrl } from "@/lib/utils/image-url";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const NAV_LINKS = [
  { label: "Products", href: ROUTES.PRODUCTS },
  { label: "Categories", href: ROUTES.CATEGORIES },
  { label: "Bundles", href: ROUTES.BUNDLES },
  { label: "Promotions", href: ROUTES.PROMOTIONS },
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Header() {
  const { user, isLoggedIn } = useAuthStore();
  const cartStore = useCartStore();
  const { setCartDrawerOpen, setSearchDialogOpen, setMobileNavOpen } =
    useUIStore();
  const { settings } = useSettingsStore();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Smooth scroll-linked header state
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10);
  });

  // Poll unread notification count for logged-in users
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = () => {
      getUnreadCount()
        .then((res) => setUnreadCount(res?.count ?? 0))
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);

    const handleFocus = () => fetchCount();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isLoggedIn]);

  const itemCount = cartStore.itemCount();

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden rounded-full"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>

          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 group"
          >
            {settings?.store_logo ? (
              <img
                src={resolveImageUrl(settings.store_logo)}
                alt={settings?.store_name ?? "Store"}
                className="h-7 w-auto"
              />
            ) : (
              <span className="text-xl font-bold tracking-tight transition-colors duration-200 group-hover:text-primary">
                {settings?.store_name ?? "Velora Verse"}
              </span>
            )}
          </Link>
        </div>

        {/* Center: Desktop navigation with shared layoutId underline */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label}
              <AnimatePresence>
                {hoveredLink === link.href && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-1 left-4 right-4 h-0.5 rounded-full bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearchDialogOpen(true)}
            aria-label="Search products"
            className="rounded-full"
          >
            <Search className="size-[18px]" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex rounded-full"
            asChild
          >
            <Link href={ROUTES.WISHLIST} aria-label="Wishlist">
              <Heart className="size-[18px]" />
            </Link>
          </Button>

          <ThemeToggle />

          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden sm:inline-flex rounded-full relative"
              asChild
            >
              <Link href={ROUTES.NOTIFICATIONS} aria-label="Notifications">
                <Bell className="size-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none animate-scale-in">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Cart with badge */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full"
            onClick={() => setCartDrawerOpen(true)}
            aria-label="Open cart"
          >
            <ShoppingCart className="size-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-none animate-scale-in">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>

          {/* User menu */}
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full ml-1"
                  aria-label="User menu"
                >
                  <Avatar size="sm">
                    {user.user_image && (
                      <AvatarImage
                        src={resolveImageUrl(user.user_image)}
                        alt={user.full_name}
                      />
                    )}
                    <AvatarFallback>
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.PROFILE}>
                      <UserCircle />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.ORDERS}>
                      <Package />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.WISHLIST}>
                      <Heart />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <Link
                href={ROUTES.LOGIN}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
