"use client";

import { useCallback } from "react";
import Link from "next/link";
import { getPlugin } from "@/plugins/registry";
import { useAuthStore } from "@/store/auth-store";
import { useCacheStore, getCacheKey } from "@/store/cache-store";

export default function BoardCard({ fid, name, isSubscribed, onToggle }: { fid: number; name: string; isSubscribed: boolean; onToggle: () => void }) {
  const plugin = getPlugin(fid);
  const requiresLogin = plugin?.requiresLogin || false;
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const locked = requiresLogin && !loggedIn;

  const hoverPrefetch = useCallback(() => {
    if (locked) return;
    // API data prefetch
    const key = getCacheKey("forum", fid, 1);
    const ca = useCacheStore.getState();
    if (!ca.get(key)) ca.prefetch(`/api/v1/forums/${fid}?page=1`, key);
    // Warm SSR cache: low-pri fetch the page HTML so server populates JSX cache
    setTimeout(() => {
      fetch(`/forum/${fid}`, { priority: "low" } as RequestInit);
    }, 800);
  }, [fid, locked]);

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 hover:bg-[rgba(126,184,255,0.06)] transition-colors ${locked ? "opacity-50" : ""}`}
      onMouseEnter={hoverPrefetch}
    >
      <Link
        href={locked ? "#" : `/forum/${fid}`}
        onClick={locked ? (e) => { e.preventDefault(); openLoginDialog(); } : undefined}
        className="flex-1 no-underline text-[var(--text-primary)] text-sm font-medium hover:text-[var(--text-link)] transition-colors flex items-center gap-1.5"
      >
        {name}
        {locked && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium" title="需要登录">需登录</span>
        )}
        {requiresLogin && loggedIn && (
          <span className="text-emerald-400 text-xs" title="已登录可访问">&#x2713;</span>
        )}
      </Link>
      <button onClick={(e) => { e.preventDefault(); onToggle(); }}
        className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-200
          ${isSubscribed ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20" : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[rgba(126,184,255,0.08)] hover:border-[var(--accent-blue)]/30"}`}>
        {isSubscribed ? "已订阅" : "订阅"}
      </button>
    </div>
  );
}
