export default function BundleDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-square animate-pulse rounded-2xl bg-muted" />

        {/* Info */}
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-2xl bg-muted" />

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="h-7 w-24 animate-pulse rounded-2xl bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-2xl bg-muted" />
          </div>

          {/* Bundle items list */}
          <div className="rounded-2xl border p-4 space-y-3">
            <div className="h-5 w-36 animate-pulse rounded-2xl bg-muted" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-40 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-3 w-16 animate-pulse rounded-2xl bg-muted" />
                </div>
              </div>
            ))}
          </div>

          <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
