import { frappeCall, frappeGet } from "./client";
import type { Address, AddressPayload } from "@/types/address";

export async function getAddresses() {
  return frappeGet<{ addresses: Address[] }>(
    "velora_verse.velora_verse.doctype.address.address.get_addresses"
  );
}

export async function addAddress(data: AddressPayload) {
  return frappeCall<{ message: string; address: string }>(
    "velora_verse.velora_verse.doctype.address.address.add_address",
    data as unknown as Record<string, unknown>
  );
}

export async function updateAddress(data: Partial<AddressPayload> & { address_name: string }) {
  return frappeCall<{ message: string; address: string }>(
    "velora_verse.velora_verse.doctype.address.address.update_address",
    data as unknown as Record<string, unknown>
  );
}

export async function deleteAddress(address_name: string) {
  return frappeCall(
    "velora_verse.velora_verse.doctype.address.address.delete_address",
    { address_name }
  );
}
