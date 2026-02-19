export default function CategoriesLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Heading skeleton */}
      <div className="h-8 w-56 animate-pulse rounded-2xl bg-muted mb-2" />
      <div className="h-5 w-80 animate-pulse rounded-2xl bg-muted mb-8" />

      {/* Category grid skeleton: matches 4-column grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Image area */}
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
