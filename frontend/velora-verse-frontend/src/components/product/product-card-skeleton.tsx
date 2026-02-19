import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Image skeleton */}
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />

      {/* Content skeleton */}
      <div className="flex flex-col gap-2 pt-4 px-1">
        {/* Category */}
        <Skeleton className="h-2.5 w-16" />

        {/* Product name */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Price */}
        <Skeleton className="h-5 w-24 mt-0.5" />
      </div>
    </div>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const;

export function ProductGridSkeleton({
  count = 8,
  columns = 4,
}: ProductGridSkeletonProps) {
  return (
    <div className={`grid gap-4 sm:gap-6 ${columnClasses[columns]}`}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
