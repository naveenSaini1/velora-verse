import { frappeCall, frappeGet } from "./client";

export async function getWishlist() {
  return frappeGet<{ items: Array<{
    variant: string;
    variant_title: string;
    item_name: string;
    slug: string;
    price: number;
    in_stock: boolean;
    image: string | null;
    added_on: string | null;
  }> }>("velora_verse.velora_verse.doctype.wishlist.wishlist.get_wishlist");
}

export async function addToWishlist(data: { variant: string }) {
  return frappeCall("velora_verse.velora_verse.doctype.wishlist.wishlist.add_to_wishlist", data);
}

export async function removeFromWishlist(data: { variant: string }) {
  return frappeCall("velora_verse.velora_verse.doctype.wishlist.wishlist.remove_from_wishlist", data);
}

export async function checkWishlist(variant: string) {
  return frappeGet<{ in_wishlist: boolean }>(
    "velora_verse.velora_verse.doctype.wishlist.wishlist.is_in_wishlist",
    { variant }
  );
}
