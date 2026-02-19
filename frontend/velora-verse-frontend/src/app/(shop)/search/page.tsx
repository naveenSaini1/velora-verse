"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchProducts, getRecentSearches, getPopularSearches } from "@/lib/api/search";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROUTES, PAGE_SIZE } from "@/lib/utils/constants";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Search, Loader2, Clock, TrendingUp } from "lucide-react";
import { ScrollReveal } from "@/components/animations";
import type { ProductListItem } from "@/types/product";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-6">
        Search Products
      </h1>
      <ProductGridSkeleton />
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const urlPage = Number(searchParams.get("page") || "1");

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(urlPage);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const performSearch = useCallback(
    async (q: string, p: number) => {
      if (!q.trim()) return;

      setLoading(true);
      setSearched(true);

      try {
        const result = await searchProducts({
          q: q.trim(),
          page: p,
          page_size: PAGE_SIZE,
        });
        setProducts(result.items);
        setTotal(result.total);
        setHasNext(result.has_next);
        setPage(result.page);
      } catch {
        setProducts([]);
        setTotal(0);
        setHasNext(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load recent and popular searches on mount
  useEffect(() => {
    getRecentSearches().then(setRecentSearches).catch(() => {});
    getPopularSearches().then(setPopularSearches).catch(() => {});
  }, []);

  // Run search from URL params (query + page)
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setSubmittedQuery(initialQuery);
      performSearch(initialQuery, urlPage);
    }
  }, [initialQuery, urlPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSubmittedQuery(q);
    setPage(1);
    performSearch(q, 1);

    // Update URL
    const params = new URLSearchParams();
    params.set("q", q);
    router.push(`${ROUTES.SEARCH}?${params.toString()}`);
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams();
    params.set("q", submittedQuery);
    if (p > 1) params.set("page", String(p));
    router.push(`${ROUTES.SEARCH}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function getPageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Search" },
        ]}
        className="mb-4"
      />

      <ScrollReveal direction="up" duration={0.4}>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-6">
        Search Products
      </h1>
      </ScrollReveal>

      {/* Search input */}
      <ScrollReveal direction="up" delay={0.1} duration={0.4}>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 rounded-xl"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!query.trim() || loading} className="rounded-xl">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>
      </ScrollReveal>

      {/* Results header */}
      {searched && submittedQuery && (
        <p className="mb-4 text-sm text-muted-foreground">
          {loading
            ? `Searching for "${submittedQuery}"...`
            : `${total} ${total === 1 ? "result" : "results"} for "${submittedQuery}"`}
        </p>
      )}

      {/* Loading state */}
      {loading && <ProductGridSkeleton />}

      {/* Results */}
      {!loading && products.length > 0 && (
        <>
          <ProductGrid products={products} />

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`${ROUTES.SEARCH}?q=${encodeURIComponent(submittedQuery)}${page > 2 ? `&page=${page - 1}` : ""}`}
                    />
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
                        href={`${ROUTES.SEARCH}?q=${encodeURIComponent(submittedQuery)}${p > 1 ? `&page=${p}` : ""}`}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                {hasNext && (
                  <PaginationItem>
                    <PaginationNext
                      href={`${ROUTES.SEARCH}?q=${encodeURIComponent(submittedQuery)}&page=${page + 1}`}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && searched && products.length === 0 && (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No results found"
          description={`We couldn't find any products matching "${submittedQuery}". Try a different search term.`}
          actionLabel="Browse All Products"
          actionHref={ROUTES.PRODUCTS}
        />
      )}

      {/* Initial state - no search yet, show suggestions */}
      {!searched && (
        <div className="max-w-xl space-y-8 py-8">
          {recentSearches.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Clock className="h-4 w-4" />
                Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setSubmittedQuery(term);
                      setPage(1);
                      performSearch(term, 1);
                      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(term)}`);
                    }}
                    className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {popularSearches.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <TrendingUp className="h-4 w-4" />
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setSubmittedQuery(term);
                      setPage(1);
                      performSearch(term, 1);
                      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(term)}`);
                    }}
                    className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentSearches.length === 0 && popularSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">
                Start typing to search for products
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
