export default function AccountLoading() {
  return (
    <div className="space-y-6">
      {/* Page heading skeleton */}
      <div>
        <div className="h-7 w-40 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Card skeleton 1 (profile / main content) */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-36 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded-2xl bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          ))}
          <div className="h-9 w-28 animate-pulse rounded-2xl bg-muted mt-2" />
        </div>
      </div>

      {/* Card skeleton 2 (secondary section) */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="space-y-2 mb-6">
          <div className="h-5 w-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-2xl bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          ))}
          <div className="h-9 w-36 animate-pulse rounded-2xl bg-muted mt-2" />
        </div>
      </div>
    </div>
  );
}
