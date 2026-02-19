import { create } from "zustand";
import type { StoreSettings } from "@/types/store-settings";

interface SettingsState {
  settings: StoreSettings | null;
  isLoaded: boolean;
  setSettings: (settings: StoreSettings) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,
  isLoaded: false,
  setSettings: (settings) => set({ settings, isLoaded: true }),
}));
