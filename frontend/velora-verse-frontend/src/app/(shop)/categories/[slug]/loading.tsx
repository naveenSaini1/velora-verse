export default function CategoryDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-28 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Category header */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Product grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-2xl border bg-card overflow-hidden">
            <div className="aspect-[3/4] animate-pulse bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded-2xl bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-2xl bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
