"use client";

import { useState, useCallback } from "react";
import * as wishlistApi from "@/lib/api/wishlist";
import { toast } from "sonner";

export function useWishlist() {
  const [wishlisted, setWishlisted] = useState(false);

  const checkWishlist = useCallback(async (variant: string) => {
    try {
      const data = await wishlistApi.checkWishlist(variant);
      setWishlisted(data.in_wishlist);
    } catch {
      setWishlisted(false);
    }
  }, []);

  const toggleWishlist = useCallback(
    async (variant: string) => {
      try {
        if (wishlisted) {
          await wishlistApi.removeFromWishlist({ variant });
          setWishlisted(false);
          toast.success("Removed from wishlist");
        } else {
          await wishlistApi.addToWishlist({ variant });
          setWishlisted(true);
          toast.success("Added to wishlist");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update wishlist");
      }
    },
    [wishlisted]
  );

  return { wishlisted, checkWishlist, toggleWishlist };
}
