"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Grid3X3,
  Package,
  Percent,
  Gift,
  UserCircle,
  ClipboardList,
  Heart,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAIN_NAV: NavItem[] = [
  { label: "Home", href: ROUTES.HOME, icon: Home },
  { label: "Products", href: ROUTES.PRODUCTS, icon: ShoppingBag },
  { label: "Categories", href: ROUTES.CATEGORIES, icon: Grid3X3 },
  { label: "Bundles", href: ROUTES.BUNDLES, icon: Package },
  { label: "Promotions", href: ROUTES.PROMOTIONS, icon: Percent },
  { label: "Gift Cards", href: ROUTES.GIFT_CARDS, icon: Gift },
];

const ACCOUNT_NAV: NavItem[] = [
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
  { label: "Orders", href: ROUTES.ORDERS, icon: ClipboardList },
  { label: "Wishlist", href: ROUTES.WISHLIST, icon: Heart },
];

const GUEST_NAV: NavItem[] = [
  { label: "Log in", href: ROUTES.LOGIN, icon: LogIn },
  { label: "Register", href: ROUTES.REGISTER, icon: UserPlus },
];

export function MobileNav() {
  const { isLoggedIn } = useAuthStore();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const { logout } = useAuth();
  const pathname = usePathname();

  function handleLinkClick() {
    setMobileNavOpen(false);
  }

  function handleLogout() {
    setMobileNavOpen(false);
    logout();
  }

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-left font-bold">Menu</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col overflow-y-auto">
          {/* Main navigation */}
          <div className="flex flex-col py-2">
            {MAIN_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Separator />

          {/* Account section */}
          <div className="flex flex-col py-2">
            {isLoggedIn ? (
              <>
                {ACCOUNT_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-5" />
                  Log out
                </button>
              </>
            ) : (
              <>
                {GUEST_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
