export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Header skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-2xl bg-muted" />
          <div className="mt-2 h-4 w-28 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 animate-pulse rounded-2xl bg-muted lg:hidden" />
          <div className="h-9 w-[180px] animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop filter sidebar skeleton */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="space-y-6">
            {/* Category filter */}
            <div className="space-y-3">
              <div className="h-5 w-24 animate-pulse rounded-2xl bg-muted" />
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                  <div
                    className="h-4 animate-pulse rounded-2xl bg-muted"
                    style={{ width: `${60 + Math.random() * 60}px` }}
                  />
                </div>
              ))}
            </div>
            {/* Price filter */}
            <div className="space-y-3">
              <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </aside>

        {/* Product grid skeleton: 4 columns on desktop */}
        <div className="flex-1">
          <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      {/* Image */}
      <div className="aspect-square w-full animate-pulse bg-muted" />
      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3 w-16 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded-2xl bg-muted" />
        <div className="flex items-center gap-1">
          <div className="h-3 w-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-3 w-8 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-5 w-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
