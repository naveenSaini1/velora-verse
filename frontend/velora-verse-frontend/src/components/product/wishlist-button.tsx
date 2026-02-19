"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  itemName: string;
  className?: string;
}

export function WishlistButton({ itemName, className }: WishlistButtonProps) {
  const { wishlisted, checkWishlist, toggleWishlist } = useWishlist();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // Check wishlist status on mount for logged-in users
  useEffect(() => {
    if (isLoggedIn && itemName) {
      checkWishlist(itemName);
    }
  }, [isLoggedIn, itemName, checkWishlist]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-sm dark:bg-black/40 dark:hover:bg-black/60",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(itemName);
      }}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          wishlisted
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
