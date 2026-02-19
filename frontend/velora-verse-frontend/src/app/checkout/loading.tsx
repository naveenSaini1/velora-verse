export default function CheckoutLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="h-7 w-32 animate-pulse rounded-2xl bg-muted mb-8" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address card */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="h-5 w-40 animate-pulse rounded-2xl bg-muted" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded-2xl bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
          </div>

          {/* Payment card */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="h-5 w-36 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 h-fit">
          <div className="h-5 w-32 animate-pulse rounded-2xl bg-muted" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-20 animate-pulse rounded-2xl bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
            </div>
          ))}
          <div className="h-px w-full bg-border" />
          <div className="flex justify-between">
            <div className="h-5 w-12 animate-pulse rounded-2xl bg-muted" />
            <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
