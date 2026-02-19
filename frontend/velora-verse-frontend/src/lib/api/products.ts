import { frappeCall, frappeGet } from "./client";
import type { Product, ProductListItem, ProductFilter, CategoryTree } from "@/types/product";
import type { PaginatedResponse } from "@/types/api";
import { toPaginatedResponse } from "@/types/api";

export async function getProducts(params: {
  page?: number;
  page_size?: number;
  category?: string;
  sort_by?: string;
  sort_order?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
}): Promise<PaginatedResponse<ProductListItem>> {
  // Backend expects `limit` not `page_size`
  const { page_size, ...rest } = params;
  const result = await frappeGet<{
    products: ProductListItem[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
  }>("velora_verse.api.products.get_products", {
    ...rest,
    limit: page_size,
  } as Record<string, unknown>);
  return toPaginatedResponse(result.products, result);
}

export async function getProductDetail(slug: string): Promise<Product> {
  const raw = await frappeGet<any>("velora_verse.api.products.get_product_detail", { slug });

  // Map backend field names to frontend types
  const variants = (raw.variants || []).map((v: any) => ({
    ...v,
    is_stock: !!v.in_stock,
    variant_values: v.values || [],
  }));

  return {
    ...raw,
    variant_table: variants.length > 0 ? variants : undefined,
  } as Product;
}

export async function getFeaturedProducts(limit?: number): Promise<ProductListItem[]> {
  const result = await frappeGet<{ products: ProductListItem[] }>(
    "velora_verse.api.products.get_featured_products",
    { limit }
  );
  return result.products;
}

export async function getRelatedProducts(item: string, limit?: number): Promise<ProductListItem[]> {
  const result = await frappeGet<{ recommendations: ProductListItem[] }>(
    "velora_verse.api.products.get_recommendations",
    { item, limit }
  );
  return result.recommendations;
}

export async function getProductFilters(): Promise<ProductFilter[]> {
  const result = await frappeGet<{
    price_range: { min: number; max: number };
    item_types: Array<{ name: string; description?: string }>;
    categories: Array<{ name: string; category_name: string; slug: string; item_count: number }>;
  }>("velora_verse.api.products.get_product_filters");

  // Transform the backend response into the ProductFilter[] shape the UI expects
  const filters: ProductFilter[] = [];

  // Category filter
  if (result.categories && result.categories.length > 0) {
    filters.push({
      field: "category",
      label: "Category",
      options: result.categories.map((c) => ({
        label: c.category_name,
        value: c.name,
        count: c.item_count,
      })),
    });
  }

  // Price range filter (expose min/max as two options for the slider)
  if (result.price_range) {
    filters.push({
      field: "base_price",
      label: "Price",
      options: [
        { label: "Min", value: String(result.price_range.min) },
        { label: "Max", value: String(result.price_range.max) },
      ],
    });
  }

  // Item type filter
  if (result.item_types && result.item_types.length > 0) {
    filters.push({
      field: "item_type",
      label: "Type",
      options: result.item_types.map((t) => ({
        label: t.name,
        value: t.name,
      })),
    });
  }

  return filters;
}

export async function getCategoryTree(): Promise<CategoryTree[]> {
  const result = await frappeGet<{ categories: CategoryTree[] }>(
    "velora_verse.api.products.get_category_tree"
  );
  return result.categories;
}

export async function getCategoryDetail(slug: string): Promise<CategoryTree> {
  return frappeGet<CategoryTree>("velora_verse.api.products.get_category_detail", { slug });
}

export async function getRecentlyViewed(): Promise<ProductListItem[]> {
  const result = await frappeGet<{ products: ProductListItem[] }>(
    "velora_verse.api.products.get_recently_viewed"
  );
  return result.products;
}

export async function recordView(item: string) {
  return frappeCall("velora_verse.api.products.track_product_view", { item });
}
