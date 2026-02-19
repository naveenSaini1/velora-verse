"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getUserProfile, logout as apiLogout } from "@/lib/api/auth";
import { clearCsrfToken } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";

export function useAuth() {
  const { user, isLoggedIn, isLoading, setUser, setLoading, logout: clearAuth } = useAuthStore();

  const hydrate = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile && profile.email && profile.email !== "Guest") {
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore logout errors
    }
    clearCsrfToken();
    clearAuth();
  };

  return { user, isLoggedIn, isLoading, hydrate, logout };
}

export function useRequireAuth(redirectTo: string = ROUTES.LOGIN) {
  const { isLoggedIn, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push(redirectTo);
    }
  }, [isLoggedIn, isLoading, router, redirectTo]);

  return { isLoggedIn, isLoading };
}

export function useGuestOnly(redirectTo: string = ROUTES.HOME) {
  const { isLoggedIn, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push(redirectTo);
    }
  }, [isLoggedIn, isLoading, router, redirectTo]);

  return { isLoggedIn, isLoading };
}
