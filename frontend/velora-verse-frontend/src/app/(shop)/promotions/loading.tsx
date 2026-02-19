export default function PromotionsLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Heading skeleton */}
      <div className="h-8 w-52 animate-pulse rounded-2xl bg-muted mb-2" />
      <div className="h-5 w-72 animate-pulse rounded-2xl bg-muted mb-8" />

      {/* Promotion grid skeleton: 3-column grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <PromotionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function PromotionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Banner image with badge */}
      <div className="relative aspect-[2/1] w-full animate-pulse bg-muted">
        <div className="absolute top-3 left-3 h-6 w-24 animate-pulse rounded-2xl bg-muted/60" />
      </div>
      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div className="h-5 w-3/4 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded-2xl bg-muted" />
        {/* Countdown placeholder */}
        <div className="flex gap-3 mt-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted" />
              <div className="h-3 w-6 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
