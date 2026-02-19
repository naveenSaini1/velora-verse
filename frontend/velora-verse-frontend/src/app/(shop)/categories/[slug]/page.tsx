import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryDetail, getProducts } from "@/lib/api/products";
import type { ProductListItem } from "@/types/product";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES, PAGE_SIZE } from "@/lib/utils/constants";
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
import type { CategoryTree } from "@/types/product";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategoryDetail(slug);
    return {
      title: category.category_name,
      description:
        category.description ||
        `Shop ${category.category_name} products at Velora Verse.`,
    };
  } catch {
    return { title: "Category Not Found" };
  }
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  let category: CategoryTree;
  try {
    category = await getCategoryDetail(slug);
  } catch {
    notFound();
  }

  let products = {
    items: [] as ProductListItem[],
    total: 0,
    page: 1,
    page_size: PAGE_SIZE,
    has_next: false,
  };

  try {
    products = await getProducts({
      category: category.name,
      page,
      page_size: PAGE_SIZE,
    });
  } catch {
    // Render with empty products
  }

  const totalPages = Math.ceil(products.total / PAGE_SIZE);

  // Build breadcrumb hierarchy
  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: "Home", href: ROUTES.HOME },
    { label: "Categories", href: ROUTES.CATEGORIES },
  ];

  // If this is a child category, show parent in breadcrumb
  if (category.parent_category) {
    breadcrumbItems.push({
      label: category.parent_category,
      href: ROUTES.CATEGORIES,
    });
  }

  breadcrumbItems.push({ label: category.category_name });

  function buildPageUrl(p: number): string {
    if (p === 1) return ROUTES.CATEGORY_DETAIL(slug);
    return `${ROUTES.CATEGORY_DETAIL(slug)}?page=${p}`;
  }

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

  // BreadcrumbList JSON-LD for SEO
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veloraverse.com";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems
      .filter((item) => item.href)
      .map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        item: `${siteUrl}${item.href}`,
      })),
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {category.category_name}
        </h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {products.total} {products.total === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Subcategories</h2>
          <div className="flex flex-wrap gap-3">
            {category.children
              .filter((c) => c.is_active)
              .sort((a, b) => a.display_order - b.display_order)
              .map((child) => (
                <Link key={child.name} href={ROUTES.CATEGORY_DETAIL(child.slug)}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-2 px-4 py-3">
                      <span className="text-sm font-medium">
                        {child.category_name}
                      </span>
                      {child.item_count != null && child.item_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {child.item_count}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      {products.items.length > 0 ? (
        <>
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={products.items} />
          </Suspense>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildPageUrl(page - 1)} />
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
                        href={buildPageUrl(p)}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                {products.has_next && (
                  <PaginationItem>
                    <PaginationNext href={buildPageUrl(page + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="No products in this category"
          description="Check back later or browse other categories."
          actionLabel="Browse All Products"
          actionHref={ROUTES.PRODUCTS}
        />
      )}
    </div>
  );
}
