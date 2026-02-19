import { frappeCall, frappeGet } from "./client";
import type { Cart } from "@/types/cart";

export async function getCart() {
  return frappeGet<Cart>("velora_verse.velora_verse.doctype.cart.cart.get_cart");
}

export async function addToCart(data: { variant: string; quantity?: number }) {
  return frappeCall<Cart>("velora_verse.velora_verse.doctype.cart.cart.add_to_cart", data);
}

export async function updateCartQuantity(data: { variant: string; quantity: number }) {
  return frappeCall<Cart>("velora_verse.velora_verse.doctype.cart.cart.update_cart_quantity", data);
}

export async function removeFromCart(data: { variant: string }) {
  return frappeCall<Cart>("velora_verse.velora_verse.doctype.cart.cart.remove_from_cart", data);
}

export async function clearCart() {
  return frappeCall<Cart>("velora_verse.velora_verse.doctype.cart.cart.clear_cart");
}
