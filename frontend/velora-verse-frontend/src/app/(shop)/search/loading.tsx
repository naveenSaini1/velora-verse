import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-2xl" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-16 rounded-2xl" />
      </div>

      {/* Heading skeleton */}
      <Skeleton className="h-8 w-48 rounded-2xl mb-6" />

      {/* Search input skeleton */}
      <div className="mb-8 flex gap-3 max-w-xl">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>

      {/* Results count skeleton */}
      <Skeleton className="h-4 w-56 rounded-2xl mb-4" />

      {/* Product grid skeleton: 4 columns on desktop */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <SearchProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function SearchProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      {/* Image */}
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-5 w-24 mt-0.5" />
      </div>
    </div>
  );
}
