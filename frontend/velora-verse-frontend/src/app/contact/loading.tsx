export default function ContactLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center space-y-2 mb-8">
        <div className="h-8 w-40 mx-auto animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-64 mx-auto animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded-2xl bg-muted" />
            <div
              className={`w-full animate-pulse rounded-2xl bg-muted ${i === 3 ? "h-28" : "h-10"}`}
            />
          </div>
        ))}
        <div className="h-11 w-full animate-pulse rounded-2xl bg-muted mt-2" />
      </div>
    </div>
  );
}
