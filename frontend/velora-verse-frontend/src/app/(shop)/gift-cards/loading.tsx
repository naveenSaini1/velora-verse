export default function GiftCardsLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="h-8 w-56 mx-auto animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-80 mx-auto animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Denomination cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="h-6 w-20 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded-2xl bg-muted" />
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto rounded-2xl border bg-card p-6 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        ))}
        <div className="h-11 w-full animate-pulse rounded-2xl bg-muted mt-2" />
      </div>
    </div>
  );
}
