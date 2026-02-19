import { frappeGet } from "./client";
import type { StoreSettings } from "@/types/store-settings";

export async function getStoreConfig() {
  return frappeGet<StoreSettings>("velora_verse.api.store_config.get_store_config");
}
