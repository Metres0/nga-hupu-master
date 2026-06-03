export default function ThreadLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      {/* Nav skeleton */}
      <div className="h-12 rounded-2xl mb-3 animate-pulse" style={{ background: "var(--glass-bg-medium)" }} />
      {/* Post cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "var(--glass-bg-light)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full" style={{ background: "var(--glass-bg-medium)" }} />
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded" style={{ background: "var(--glass-bg-medium)" }} />
                <div className="h-2.5 w-16 rounded" style={{ background: "var(--glass-bg-medium)" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded" style={{ background: "var(--glass-bg-medium)" }} />
              <div className="h-3 w-5/6 rounded" style={{ background: "var(--glass-bg-medium)" }} />
              <div className="h-3 w-2/3 rounded" style={{ background: "var(--glass-bg-medium)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
