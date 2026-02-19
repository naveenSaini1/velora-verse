import { create } from "zustand";
import type { Cart, CartItem } from "@/types/cart";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  setCart: (cart: Cart | null) => void;
  setLoading: (loading: boolean) => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  isLoading: false,
  setCart: (cart) => set({ cart, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  itemCount: () => {
    const cart = get().cart;
    if (!cart?.items) return 0;
    return cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  },
}));
