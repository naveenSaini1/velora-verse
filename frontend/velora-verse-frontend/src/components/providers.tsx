"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { getUserProfile } from "@/lib/api/auth";
import { getStoreConfig } from "@/lib/api/store-config";

function AuthHydration() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function hydrate() {
      try {
        const profile = await getUserProfile();
        // Only treat as logged in if we got a valid user with an email
        if (profile && profile.email && profile.email !== "Guest") {
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    hydrate();
  }, [setUser, setLoading]);

  return null;
}

function SettingsHydration() {
  const setSettings = useSettingsStore((s) => s.setSettings);

  useEffect(() => {
    async function hydrate() {
      try {
        const config = await getStoreConfig();
        setSettings(config);
      } catch {
        // Settings will remain null — components handle this
      }
    }
    hydrate();
  }, [setSettings]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AuthHydration />
        <SettingsHydration />
        {children}
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}
