export default function CartLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        <div className="h-7 w-40 animate-pulse rounded-2xl bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items column */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-card divide-y">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-6">
                {/* Product thumbnail */}
                <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-muted" />
                {/* Product info */}
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded-2xl bg-muted" />
                  {/* Quantity control */}
                  <div className="h-8 w-32 animate-pulse rounded-2xl bg-muted" />
                </div>
                {/* Price + remove */}
                <div className="flex flex-col items-end gap-2">
                  <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Coupon card */}
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="h-5 w-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
          </div>

          {/* Order summary card */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="h-5 w-32 animate-pulse rounded-2xl bg-muted" />
            {/* Line items */}
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 animate-pulse rounded-2xl bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
            {/* Divider */}
            <div className="h-px w-full bg-border" />
            {/* Total */}
            <div className="flex justify-between">
              <div className="h-5 w-12 animate-pulse rounded-2xl bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
            </div>
            {/* Checkout button */}
            <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
