export default function OrderConfirmationLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center space-y-4 mb-10">
        <div className="h-16 w-16 mx-auto animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-56 mx-auto animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-72 mx-auto animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        {/* Order info rows */}
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded-2xl bg-muted" />
          </div>
        ))}
        <div className="h-px w-full bg-border" />
        {/* Items */}
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-40 animate-pulse rounded-2xl bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        ))}
        <div className="h-px w-full bg-border" />
        <div className="flex justify-between">
          <div className="h-5 w-12 animate-pulse rounded-2xl bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>

      <div className="flex gap-4 mt-6 justify-center">
        <div className="h-10 w-36 animate-pulse rounded-2xl bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
