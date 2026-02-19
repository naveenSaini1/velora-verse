export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-24 rounded-xl bg-muted" />
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-[340px] rounded-2xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
