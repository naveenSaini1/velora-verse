import { frappeGet } from "./client";

export async function checkPincode(pincode: string) {
  return frappeGet<{ serviceable: boolean; city?: string; state?: string; estimated_days?: number }>(
    "velora_verse.api.shipping.check_pincode", { pincode }
  );
}

export async function getShippingRates(params: { shipping_address: string }) {
  return frappeGet<{ shipping_charge: number; free_shipping: boolean; zone_name?: string; rates?: Array<{ method: string; charge: number; estimated_days: number }> }>(
    "velora_verse.api.shipping.get_shipping_rates", params
  );
}
