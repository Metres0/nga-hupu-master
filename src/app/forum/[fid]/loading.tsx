export default function ForumLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      {/* Nav skeleton */}
      <div className="h-12 rounded-2xl mb-3 animate-pulse" style={{ background: "var(--glass-bg-medium)" }} />
      {/* Search + sort bar */}
      <div className="flex gap-2 mb-4">
        <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: "var(--glass-bg-medium)" }} />
        <div className="h-8 w-16 rounded-full animate-pulse" style={{ background: "var(--glass-bg-light)" }} />
        <div className="h-8 w-16 rounded-full animate-pulse" style={{ background: "var(--glass-bg-light)" }} />
        <div className="h-8 w-16 rounded-full animate-pulse ml-auto" style={{ background: "var(--glass-bg-light)" }} />
      </div>
      {/* Thread list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-[72px] rounded-2xl animate-pulse flex items-center px-5" style={{ background: "var(--glass-bg-light)" }}>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded" style={{ background: "var(--glass-bg-medium)" }} />
              <div className="h-3 w-1/2 rounded" style={{ background: "var(--glass-bg-medium)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
