export default function PromotionDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banner */}
      <div className="h-48 animate-pulse rounded-2xl bg-muted mb-8" />

      {/* Title + countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Product grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border bg-card overflow-hidden">
            <div className="aspect-[3/4] animate-pulse bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded-2xl bg-muted" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded-2xl bg-muted" />
                <div className="h-4 w-12 animate-pulse rounded-2xl bg-muted line-through" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
