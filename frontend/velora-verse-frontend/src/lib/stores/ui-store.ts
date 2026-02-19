import { create } from "zustand";

interface UIState {
  cartDrawerOpen: boolean;
  searchDialogOpen: boolean;
  mobileNavOpen: boolean;
  quickViewSlug: string | null;
  setCartDrawerOpen: (open: boolean) => void;
  setSearchDialogOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setQuickViewSlug: (slug: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  cartDrawerOpen: false,
  searchDialogOpen: false,
  mobileNavOpen: false,
  quickViewSlug: null,
  setCartDrawerOpen: (cartDrawerOpen) => set({ cartDrawerOpen }),
  setSearchDialogOpen: (searchDialogOpen) => set({ searchDialogOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setQuickViewSlug: (quickViewSlug) => set({ quickViewSlug }),
}));
