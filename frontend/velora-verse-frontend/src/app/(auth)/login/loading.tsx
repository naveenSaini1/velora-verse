export default function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center space-y-2">
          <div className="h-8 w-48 mx-auto animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-64 mx-auto animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 animate-pulse rounded-2xl bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          ))}
          <div className="h-10 w-full animate-pulse rounded-2xl bg-muted mt-2" />
        </div>
      </div>
    </div>
  );
}
