export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
          {/* Thumbnail strip */}
          <div className="flex gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-16 w-16 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-6">
          {/* Category badge */}
          <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />

          {/* Product title */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 animate-pulse rounded-2xl bg-muted" />
            <div className="h-8 w-1/2 animate-pulse rounded-2xl bg-muted" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-2xl bg-muted" />
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 animate-pulse rounded-2xl bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-2xl bg-muted" />
          </div>

          {/* Variant selector (simulated) */}
          <div className="space-y-3">
            <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-10 w-14 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-4">
            <div className="h-11 w-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-11 flex-1 animate-pulse rounded-2xl bg-muted" />
          </div>

          {/* Pincode checker */}
          <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />

          {/* Description */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="h-5 w-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>

      {/* Related products section skeleton */}
      <div className="mt-16">
        <div className="mb-6 h-7 w-48 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-square w-full animate-pulse bg-muted" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-3 w-16 animate-pulse rounded-2xl bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded-2xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
