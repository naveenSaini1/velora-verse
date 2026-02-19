"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserCircle,
  MapPin,
  ClipboardList,
  Heart,
  RotateCcw,
  Star,
  Gift,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/auth-store";

interface AccountLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ACCOUNT_LINKS: AccountLink[] = [
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
  { label: "Addresses", href: ROUTES.ADDRESSES, icon: MapPin },
  { label: "Orders", href: ROUTES.ORDERS, icon: ClipboardList },
  { label: "Wishlist", href: ROUTES.WISHLIST, icon: Heart },
  { label: "Returns", href: ROUTES.RETURNS, icon: RotateCcw },
  { label: "Loyalty Points", href: ROUTES.LOYALTY, icon: Star },
  { label: "Gift Cards", href: ROUTES.MY_GIFT_CARDS, icon: Gift },
  { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: Bell },
];

function isAdmin(roles?: string[]): boolean {
  if (!roles) return false;
  return roles.some((r) =>
    ["Administrator", "System Manager", "Store Admin"].includes(r)
  );
}

interface AccountSidebarProps {
  className?: string;
}

export function AccountSidebar({ className }: AccountSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const showAdmin = isAdmin(user?.roles);

  function isActive(href: string): boolean {
    if (href === pathname) return true;
    if (href !== "/" && pathname.startsWith(href + "/")) return true;
    return false;
  }

  const allLinks = showAdmin
    ? [
        ...ACCOUNT_LINKS,
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: Shield,
        },
      ]
    : ACCOUNT_LINKS;

  return (
    <>
      {/* Desktop: Vertical sidebar */}
      <aside className={cn("hidden md:block", className)}>
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
          <p className="mb-2 px-3 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My Account
          </p>
          <nav className="flex flex-col gap-0.5">
            {allLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <link.icon className="size-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile: Horizontal scrollable tabs */}
      <div className="md:hidden w-full overflow-hidden">
        <nav className="flex overflow-x-auto scrollbar-none gap-1 pb-1">
          {allLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <link.icon className="size-3.5 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
