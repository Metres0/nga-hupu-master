"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BoardExplorer from "@/components/widgets/BoardExplorer";
import { GlassSkeleton } from "@/components/ui/GlassSkeleton";
import { GlassButton } from "@/components/ui/GlassButton";
import { useUiStore } from "@/store/ui-store";
import { useCacheStore, getCacheKey } from "@/store/cache-store";
import type { BoardNode } from "@/lib/types";

interface HomeClientProps { initialBoards: BoardNode[]; lastUpdated: number | null; staleMinutes: number; }

export default function HomeClient({ initialBoards, lastUpdated: initUpdated, staleMinutes: initStale }: HomeClientProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardNode[]>(initialBoards);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(initUpdated);
  const [staleMinutes, setStaleMinutes] = useState(initStale);
  const [hasServerData] = useState(initialBoards.length > 0);
  const loadFromStorage = useUiStore((s) => s.loadFromStorage);
  const subscribed = useUiStore((s) => s.subscriptions);
  const subscribedFids = subscribed.map((s) => s.fid);
  const preloadedRef = useRef(new Set<number>());

  useEffect(() => {
    loadFromStorage(); if (hasServerData) return; setLoading(true);
    fetch("/api/v1/boards").then((res) => { if (!res.ok) throw new Error("加载失败"); return res.json(); })
      .then((json) => { if (json.forums && json.forums.length > 0) setBoards(buildTree(json.forums)); setLastUpdated(json.lastUpdated); setStaleMinutes(json.staleMinutes || 0); })
      .catch((err) => setError(err.message || "加载失败")).finally(() => setLoading(false));
  }, [loadFromStorage, hasServerData]);

  useEffect(() => {
    if (subscribedFids.length === 0) return;
    const ca = useCacheStore.getState();
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let cancelled = false;
    (async () => {
      // Prefetch ALL subscribed forums (not just first 5)
      for (const fid of subscribedFids.slice(0, 8)) {
        if (cancelled) return;
        if (preloadedRef.current.has(fid)) continue;
        preloadedRef.current.add(fid);
        const key = getCacheKey("forum", fid, 1);
        ca.pin(key);
        if (!ca.get(key)?.data) { await ca.prefetch(`/api/v1/forums/${fid}?page=1`, key); await delay(80); }
      }
    })();
    return () => { cancelled = true; };
  }, [subscribedFids]);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      {/* YU7 Skyline Hero — 亮天空 + 强玻璃 + 精密 HUD */}
      <header className="mb-8">
        <div className="glass-card-elevated skyline-reflection relative overflow-hidden">
          {/* 顶部精密状态条 */}
          <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" style={{ boxShadow: "0 0 6px rgba(25,118,210,0.60)" }} />
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--text-secondary)]">NGA Mirror · Skyline</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-[var(--text-tertiary)] tabular-nums">
              <span className="hidden sm:inline">SYS ONLINE</span>
            </div>
          </div>

          <div className="relative z-10 p-8 md:p-12">
            <div className="mb-8">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--text-tertiary)]">SKY · 01</span>
                <div className="hud-line flex-1" />
              </div>
              <h1 className="text-[36px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.08] mb-4">
                <span className="glow-sky font-medium">天际阅读</span>
                <span className="text-[var(--text-tertiary)] mx-3 font-light">/</span>
                <span className="text-[var(--text-primary)]">NGA 镜像站</span>
              </h1>
              <p className="text-[15px] md:text-[16px] font-light text-[var(--text-secondary)] tracking-[0.02em] leading-[1.8] max-w-md">
                连接万千玩家的声音，在清透的玻璃下阅读每一个故事
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hud-chip-active">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(74,222,128,0.6)" }} />
                <span className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">{boards.length}</span>
                <span className="text-[11px] text-[var(--text-tertiary)]">个板块</span>
              </div>
              {lastUpdated && (
                <div className="hud-chip">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-tertiary)]">UPD</span>
                  <span className="text-[13px] text-[var(--text-secondary)] tabular-nums">
                    {staleMinutes < 1 ? "刚刚" : `${staleMinutes}m`}
                  </span>
                </div>
              )}
              {lastUpdated && (
                <button
                  onClick={() => window.location.reload()}
                  className="hud-chip text-[var(--md-primary)] hover:bg-[rgba(126,184,255,0.14)] transition-all cursor-pointer"
                >
                  <span className="text-[11px] tracking-[0.15em] uppercase">SYNC</span>
                  <span className="text-[12px]">↻</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative z-10 hud-line-bottom" />
        </div>

        <div className="mt-6">
          <HomeSearch />
        </div>
      </header>

      {loading ? (<div className="space-y-3"><GlassSkeleton className="h-48 rounded-2xl" /><GlassSkeleton className="h-64 rounded-2xl" /></div>)
      : error ? (
        <div className="glass-card rounded-2xl text-center py-16">
          <p className="text-[var(--md-error)] text-sm mb-4">{error}</p>
          <GlassButton variant="secondary" onClick={() => window.location.reload()}>重试</GlassButton>
        </div>
      ) : boards.length > 0 ? (<BoardExplorer boards={boards} />)
      : (
        <div className="glass-card rounded-2xl text-center py-16">
          <div className="text-4xl mb-3 opacity-30">*</div>
          <p className="text-[var(--text-secondary)] text-sm">板块数据尚未加载</p>
          <p className="text-[var(--text-tertiary)] text-label mt-2">运行 scripts/scrape-boards.ts 初始化</p>
        </div>
      )}
    </div>
  );
}

function buildTree(forums: Array<{ fid: number; name: string; parent_fid: number | null }>): BoardNode[] {
  const map = new Map<number, BoardNode>(); const roots: BoardNode[] = [];
  forums.forEach((f) => map.set(f.fid, { fid: f.fid, name: f.name, parentFid: f.parent_fid, children: [] }));
  forums.forEach((f) => { const node = map.get(f.fid)!; if (f.parent_fid && map.has(f.parent_fid)) map.get(f.parent_fid)!.children.push(node); else roots.push(node); });
  roots.sort((a, b) => (a.fid < 0 ? -1 : 1) || a.name.localeCompare(b.name, "zh"));
  return roots;
}

function HomeSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="搜索帖子内容... (回车搜索)"
        className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" />
    </form>
  );
}
