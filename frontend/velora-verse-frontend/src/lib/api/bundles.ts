import { frappeGet } from "./client";
import type { Bundle, BundleItem } from "@/types/bundle";

interface BackendBundleListItem {
  name: string;
  bundle_name: string;
  slug?: string;
  bundle_price: number;
  individual_total: number;
  savings_amount: number;
  savings_percentage: number;
  primary_image?: string;
  item_count?: number;
}

interface BackendBundleDetail {
  name: string;
  bundle_name: string;
  slug?: string;
  description?: string;
  bundle_price: number;
  individual_total: number;
  savings_amount: number;
  savings_percentage: number;
  items: Array<{
    variant: string;
    variant_title?: string;
    bundle_quantity: number;
    individual_price: number;
    in_stock?: number;
    item_name?: string;
  }>;
  images: Array<{
    image: string;
    alt_text?: string;
    is_primary: number;
    display_order: number;
  }>;
}

function mapBundleListItem(b: BackendBundleListItem): Bundle {
  // Create placeholder bundle_items array of the right length for the card display
  const itemCount = b.item_count || 0;
  const placeholderItems: BundleItem[] = Array.from({ length: itemCount }, (_, i) => ({
    name: `placeholder-${i}`,
    variant: "",
    quantity: 1,
    individual_price: 0,
  }));

  return {
    name: b.name,
    bundle_name: b.bundle_name,
    slug: b.slug,
    image: b.primary_image,
    is_active: true, // Only active bundles are returned
    bundle_items: placeholderItems,
    total_price: b.individual_total,
    bundle_price: b.bundle_price,
    savings: b.savings_amount,
    savings_percent: b.savings_percentage,
  };
}

function mapBundleDetail(b: BackendBundleDetail): Bundle {
  // Find primary image
  const primaryImg = b.images?.find((img) => img.is_primary) || b.images?.[0];

  return {
    name: b.name,
    bundle_name: b.bundle_name,
    slug: b.slug,
    description: b.description,
    image: primaryImg?.image,
    is_active: true,
    bundle_items: (b.items || []).map((item) => ({
      name: item.variant || "",
      variant: item.variant,
      variant_title: item.variant_title,
      item_name: item.item_name,
      quantity: item.bundle_quantity,
      individual_price: item.individual_price,
    })),
    total_price: b.individual_total,
    bundle_price: b.bundle_price,
    savings: b.savings_amount,
    savings_percent: b.savings_percentage,
  };
}

export async function getBundles(): Promise<Bundle[]> {
  const result = await frappeGet<{
    bundles: BackendBundleListItem[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  }>("velora_verse.api.bundles.get_bundles");
  return result.bundles.map(mapBundleListItem);
}

export async function getBundleDetail(slugOrName: string): Promise<Bundle> {
  // Backend accepts both `slug` and `name` params
  const result = await frappeGet<BackendBundleDetail>(
    "velora_verse.api.bundles.get_bundle_detail",
    { slug: slugOrName }
  );
  return mapBundleDetail(result);
}
