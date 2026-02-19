export default function BundlesLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Heading skeleton */}
      <div className="h-8 w-48 animate-pulse rounded-2xl bg-muted mb-2" />
      <div className="h-5 w-96 max-w-full animate-pulse rounded-2xl bg-muted mb-8" />

      {/* Bundle grid skeleton: 3-column grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <BundleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function BundleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Image area with savings badge */}
      <div className="relative aspect-[4/3] w-full animate-pulse bg-muted">
        <div className="absolute top-3 right-3 h-6 w-16 animate-pulse rounded-2xl bg-muted/60" />
      </div>
      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <div className="h-5 w-3/4 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded-2xl bg-muted" />
        {/* Badge */}
        <div className="mt-1 h-5 w-16 animate-pulse rounded-2xl bg-muted" />
        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
