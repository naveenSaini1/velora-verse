import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryTree } from "@/lib/api/products";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/animations";
import { ROUTES } from "@/lib/utils/constants";
import { LayoutGrid } from "lucide-react";
import type { CategoryTree } from "@/types/product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse product categories at Velora Verse.",
};

export default async function CategoriesPage() {
  let categories: CategoryTree[] = [];

  try {
    categories = await getCategoryTree();
  } catch {
    // Render with empty state
  }

  // Only show top-level (non-child) categories, sorted by display_order
  const topLevel = categories
    .filter((c) => !c.is_child && c.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Categories" },
        ]}
        className="mb-4"
      />

      <ScrollReveal direction="up" duration={0.5}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
          Shop by Category
        </h1>
        <p className="text-muted-foreground mb-8">
          Explore our curated collections to find what you love.
        </p>
      </ScrollReveal>

      {topLevel.length > 0 ? (
        <ScrollReveal direction="up" delay={0.15} duration={0.6}>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {topLevel.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal direction="up" duration={0.5}>
          <EmptyState
            icon={<LayoutGrid className="h-12 w-12" />}
            title="No categories yet"
            description="Check back soon for our product categories."
            actionLabel="Browse Products"
            actionHref={ROUTES.PRODUCTS}
          />
        </ScrollReveal>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryTree }) {
  return (
    <Link href={ROUTES.CATEGORY_DETAIL(category.slug)}>
      <Card className="group overflow-hidden rounded-2xl border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-200 h-full">
        {category.image ? (
          <div className="relative aspect-[4/3] overflow-hidden">
            <FrappeImage
              src={category.image}
              alt={category.category_name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-5xl font-bold text-primary/40">
              {category.category_name.charAt(0)}
            </span>
          </div>
        )}
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">
            {category.category_name}
          </h2>
          {category.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {category.item_count != null && category.item_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {category.item_count} {category.item_count === 1 ? "product" : "products"}
              </Badge>
            )}
            {category.children.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {category.children.length} {category.children.length === 1 ? "subcategory" : "subcategories"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
