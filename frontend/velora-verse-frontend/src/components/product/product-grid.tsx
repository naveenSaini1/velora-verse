import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/product";

interface ProductGridProps {
  products: ProductListItem[];
  columns?: 2 | 3 | 4;
}

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const;

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-5 sm:gap-8 lg:gap-10", columnClasses[columns])}>
      {products.map((product) => (
        <ProductCard key={product.name} product={product} />
      ))}
    </div>
  );
}
