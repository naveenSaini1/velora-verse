import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isLoading: true,
      setUser: (user) => set({ user, isLoggedIn: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isLoggedIn: false, isLoading: false }),
    }),
    {
      name: "velora-auth",
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
);
