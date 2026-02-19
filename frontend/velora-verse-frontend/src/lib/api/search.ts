import { frappeCall, frappeGet } from "./client";
import type { ProductListItem } from "@/types/product";
import type { PaginatedResponse } from "@/types/api";

export async function searchProducts(params: {
  q: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<ProductListItem>> {
  // Backend function is `search_products` in products.py, expects `query` and `limit`
  const result = await frappeGet<{
    products: ProductListItem[];
    total_count: number;
  }>("velora_verse.api.products.search_products", {
    query: params.q,
    limit: params.page_size,
  } as Record<string, unknown>);

  // search_products doesn't paginate with page/limit like get_products,
  // it just returns up to `limit` results. Map to PaginatedResponse shape.
  return {
    items: result.products,
    total: result.total_count,
    page: params.page || 1,
    page_size: params.page_size || 20,
    has_next: false, // Backend search endpoint returns all matching results up to limit
  };
}

export async function autocomplete(q: string) {
  // Backend expects param name `query`, not `q`
  const result = await frappeGet<{
    results: Array<{
      name: string;
      item_name?: string;
      slug?: string;
      base_price?: number;
      category_name?: string;
      type_name?: string;
      result_type: string;
    }>;
  }>("velora_verse.api.search.autocomplete", { query: q });

  // Transform backend results into the shape the search dialog expects:
  // { value: string; label: string; image?: string }
  return result.results.map((r) => ({
    value: r.slug || r.name,
    label: r.item_name || r.category_name || r.type_name || r.name,
    image: undefined as string | undefined,
  }));
}

export async function getTrendingSearches(): Promise<string[]> {
  // Backend returns { trending: [{ search_term, search_count }] }
  const result = await frappeGet<{
    trending: Array<{ search_term: string; search_count?: number }>;
  }>("velora_verse.api.search.trending_searches");

  return result.trending.map((t) => t.search_term);
}

export async function getRecentSearches(): Promise<string[]> {
  const result = await frappeGet<{ searches: string[] }>(
    "velora_verse.api.search.get_recent_searches"
  );
  return result.searches;
}

export async function getPopularSearches(): Promise<string[]> {
  const result = await frappeGet<{ searches: string[] }>(
    "velora_verse.api.search.get_popular_searches"
  );
  return result.searches;
}

export async function removeRecentSearch(query: string): Promise<void> {
  await frappeCall("velora_verse.api.search.remove_recent_search", { query });
}
