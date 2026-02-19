import { Suspense } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { getProducts, getProductFilters } from "@/lib/api/products";
import type { ProductListItem, ProductFilter } from "@/types/product";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollReveal } from "@/components/animations";
import { ROUTES, SORT_OPTIONS, PAGE_SIZE } from "@/lib/utils/constants";
import { ShoppingBag } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { SortSelectClient } from "./sort-select";
import { ProductFilters, MobileFilterSheet } from "./filters";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our complete collection of products at Velora Verse.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort_by?: string;
    sort_order?: string;
    min_price?: string;
    max_price?: string;
    in_stock?: string;
    is_featured?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category || undefined;
  const min_price = params.min_price ? Number(params.min_price) : undefined;
  const max_price = params.max_price ? Number(params.max_price) : undefined;
  const in_stock = params.in_stock === "true" ? true : undefined;
  const is_featured = params.is_featured === "true" ? true : undefined;

  // Parse sort option (format: "field:order")
  const sortValue = params.sort_by && params.sort_order
    ? `${params.sort_by}:${params.sort_order}`
    : undefined;
  const sort_by = params.sort_by || undefined;
  const sort_order = params.sort_order || undefined;

  let products = { items: [] as ProductListItem[], total: 0, page: 1, page_size: PAGE_SIZE, has_next: false };
  let filters: ProductFilter[] = [];

  try {
    [products, filters] = await Promise.all([
      getProducts({
        page,
        page_size: PAGE_SIZE,
        category,
        sort_by,
        sort_order,
        min_price,
        max_price,
        in_stock,
        is_featured,
      }).catch(() => products),
      getProductFilters().catch(() => []),
    ]);
  } catch {
    // Render with defaults
  }

  const totalPages = Math.ceil(products.total / PAGE_SIZE);

  // Build URL for pagination / filter links
  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string> = {};
    if (category) merged.category = category;
    if (sort_by) merged.sort_by = sort_by;
    if (sort_order) merged.sort_order = sort_order;
    if (min_price !== undefined) merged.min_price = String(min_price);
    if (max_price !== undefined) merged.max_price = String(max_price);
    if (in_stock) merged.in_stock = "true";
    if (is_featured) merged.is_featured = "true";

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === "") {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }

    const qs = new URLSearchParams(merged).toString();
    return qs ? `${ROUTES.PRODUCTS}?${qs}` : ROUTES.PRODUCTS;
  }

  // Generate page numbers for pagination
  function getPageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  }

  const activeFilterCount = [category, min_price, max_price, in_stock, is_featured].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Products" },
        ]}
        className="mb-4"
      />

      <ScrollReveal direction="up" duration={0.5}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.total} {products.total === 1 ? "product" : "products"} found
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <MobileFilterSheet
              filters={filters}
              activeCategory={category}
              activeMinPrice={min_price}
              activeMaxPrice={max_price}
              activeInStock={!!in_stock}
              activeIsFeatured={!!is_featured}
              activeFilterCount={activeFilterCount}
            />

            {/* Sort dropdown */}
            <SortSelect currentValue={sortValue} />
          </div>
        </div>
      </ScrollReveal>

      <div className="flex gap-8">
        {/* Desktop filter sidebar */}
        <ScrollReveal direction="left" delay={0.1} duration={0.5} className="hidden w-64 shrink-0 lg:block">
          <ProductFilters
            filters={filters}
            activeCategory={category}
            activeMinPrice={min_price}
            activeMaxPrice={max_price}
            activeInStock={!!in_stock}
            activeIsFeatured={!!is_featured}
          />
        </ScrollReveal>

        {/* Product grid */}
        <div className="flex-1">
          {products.items.length > 0 ? (
            <>
              <ScrollReveal direction="up" delay={0.15} duration={0.6}>
                <Suspense fallback={<ProductGridSkeleton />}>
                  <ProductGrid products={products.items} />
                </Suspense>
              </ScrollReveal>

              {/* Pagination */}
              {totalPages > 1 && (
                <ScrollReveal direction="up" delay={0.2} duration={0.4}>
                <Pagination className="mt-8">
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious href={buildUrl({ page: String(page - 1) })} />
                      </PaginationItem>
                    )}

                    {getPageNumbers().map((p, i) =>
                      p === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href={buildUrl({ page: p === 1 ? undefined : String(p) })}
                            isActive={p === page}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    {products.has_next && (
                      <PaginationItem>
                        <PaginationNext href={buildUrl({ page: String(page + 1) })} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
                </ScrollReveal>
              )}
            </>
          ) : (
            <ScrollReveal direction="up" duration={0.5}>
              <EmptyState
                icon={<ShoppingBag className="h-12 w-12" />}
                title="No products found"
                description="Try adjusting your filters or browse all products."
                actionLabel="Clear Filters"
                actionHref={ROUTES.PRODUCTS}
              />
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  );
}

function SortSelect({ currentValue }: { currentValue?: string }) {
  return (
    <SortSelectClient currentValue={currentValue} />
  );
}
