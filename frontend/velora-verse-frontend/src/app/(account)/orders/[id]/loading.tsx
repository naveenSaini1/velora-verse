export default function OrderDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 rounded-xl bg-muted" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-44 rounded-xl bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-36 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-36 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Timeline */}
      <div className="h-24 rounded-2xl bg-muted" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items card */}
          <div className="rounded-2xl border border-border/60 p-6 space-y-4">
            <div className="h-5 w-24 rounded bg-muted" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-20 w-20 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border border-border/60 p-6 space-y-3">
            <div className="h-5 w-32 rounded bg-muted" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
            <div className="border-t border-border/60 pt-3 flex justify-between">
              <div className="h-5 w-12 rounded bg-muted" />
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border/60 p-6 space-y-3">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
