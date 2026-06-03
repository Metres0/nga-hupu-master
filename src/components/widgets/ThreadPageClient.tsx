"use client";

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/widgets/PostCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import GlassNav from "@/components/widgets/GlassNav";
import { GlassSkeletonList } from "@/components/ui/GlassSkeleton";
import ReplyForm from "@/components/widgets/ReplyForm";
import { buildReplyTree, flattenTree } from "@/lib/reply-tree";
import { useCacheStore, getCacheKey } from "@/store/cache-store";
import { useThreadStore } from "@/store/thread-store";
import { useReplyStore } from "@/store/reply-store";
import { useScrollRestore } from "@/lib/scroll-restore";
import { markAsRead } from "@/lib/read-tracking";

interface ThreadPageProps {
  tid: number; fid: number; page: number;
  initialPosts?: any[] | null;
  threadInfo?: { title: string; author: string; replyCount: number; totalPages: number } | null;
}

export default function ThreadPageClient({ tid: propTid, fid: propFid, page: propPage, initialPosts, threadInfo }: ThreadPageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tid = propTid || parseInt(params.tid as string);
  const fid = propFid || parseInt(params.fid as string);
  const currentPage = propPage || parseInt(searchParams.get("page") || "1");
  const store = useThreadStore();
  const loadedRef = useRef<string>("");
  useScrollRestore(`thread:${tid}:${currentPage}`);
  useEffect(() => { markAsRead(tid); }, [tid]);

  // Synchronous seed: check cache-store or SSR data DURING render.
  const seeded = useRef(false);
  if (!seeded.current) {
    seeded.current = true;
    const cacheKey = getCacheKey("thread", tid, currentPage);
    const cached = useCacheStore.getState().get<any>(cacheKey);
    if (cached?.data) {
      store.seed({ thread: (cached.data.thread || { tid, fid } as any), posts: cached.data.posts || [], totalPages: cached.data.totalPages || 1, loading: false, pageLoading: false });
    } else if (initialPosts && currentPage === 1) {
      store.seed({ thread: { tid, fid, title: threadInfo?.title || "", author: threadInfo?.author || "", replyCount: threadInfo?.replyCount || 0 } as any, posts: initialPosts, totalPages: threadInfo?.totalPages || 1, loading: false });
      // Note: NOT writing to cacheStore here — SSR posts are lightweight (no contentHtml).
      // The useEffect will detect this and fetch full data from API.
    }
  }

  useEffect(() => {
    const loadKey = `${tid}:${currentPage}`;
    if (loadedRef.current === loadKey) return;
    loadedRef.current = loadKey;
    const st = useThreadStore.getState();
    // If store has FULL data (posts with content), just SWR refresh on stale
    const hasContent = st.posts.length > 0 && st.posts.some((p: any) => p.contentHtml || p.content);
    if (hasContent && !st.loading) {
      const cacheKey = getCacheKey("thread", tid, currentPage);
      const c = useCacheStore.getState().get<any>(cacheKey);
      if (c?.stale) {
        useCacheStore.getState().prefetch(`/api/v1/threads/${tid}?page=${currentPage}`, cacheKey);
      }
      return;
    }
    // Fallback: store is empty or has only metadata — fetch full data
    if (currentPage !== 1) store.setPageLoading(true);
    else store.setLoading(true);
    store.setError(null);
    const cacheKey = getCacheKey("thread", tid, currentPage);
    useCacheStore.getState().prefetch(`/api/v1/threads/${tid}?page=${currentPage}`, cacheKey)?.then((json: any) => {
      if (!json?.posts) throw new Error("empty");
      const ta = useThreadStore.getState();
      ta.setThread(json.thread || { tid, fid } as any);
      ta.setPosts(json.posts); ta.setTotalPages(json.totalPages || 1);
      ta.setLoading(false); ta.setPageLoading(false);
    }).catch((err) => {
      useThreadStore.getState().setError(err.message || "加载失败");
      useThreadStore.getState().setLoading(false);
      useThreadStore.getState().setPageLoading(false);
    });
  }, [tid, fid, currentPage]);

  function retryFetch() {
    const ta = useThreadStore.getState();
    ta.setError(null); ta.setLoading(true);
    const cacheKey = getCacheKey("thread", tid, currentPage);
    useCacheStore.getState().prefetch(`/api/v1/threads/${tid}?page=${currentPage}`, cacheKey)
      ?.then((json: any) => {
        if (!json?.posts) throw new Error("empty");
        const ta = useThreadStore.getState();
        ta.setThread(json.thread || { tid, fid } as any);
        ta.setPosts(json.posts);
        ta.setTotalPages(json.totalPages || 1);
        ta.setLoading(false);
      })
      .catch((err) => { useThreadStore.getState().setError(err.message); useThreadStore.getState().setLoading(false); });
  }

  function goPage(p: number) {
    if (p < 1 || p > store.totalPages) return;
    const sp = new URLSearchParams(searchParams.toString());
    if (p === 1) sp.delete("page"); else sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  }

  if (store.error && store.posts.length === 0) {
    return (
      <div>
        <GlassNav forumName={`帖子 #${tid}`} forumFid={fid} showBack />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-[var(--accent-red)] mb-4">{store.error}</p>
          <div className="flex justify-center gap-3">
            <GlassButton variant="primary" onClick={retryFetch}>重试</GlassButton>
            <Link href={`/forum/${fid}`} className="no-underline"><GlassButton variant="secondary">返回板块</GlassButton></Link>
          </div>
        </div>
      </div>
    );
  }

  const treeNodes = useMemo(() => buildReplyTree(store.posts), [store.posts]);
  const flatNodes = useMemo(() => flattenTree(treeNodes), [treeNodes]);
  const replyMap = useMemo(() => {
    const map = new Map<number, typeof store.posts[0]>();
    for (const p of store.posts) map.set(p.floor, p);
    return map;
  }, [store.posts]);
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);
  const openPid = useReplyStore((s) => s.openPid);

  const filtered = useMemo(() => {
    const q = deferredFilter.trim();
    if (!q) return flatNodes;
    if (/^\d+$/.test(q)) return flatNodes.filter(n => String(n.post.floor).includes(q));
    return flatNodes.filter(n =>
      n.post.author.includes(q) || n.post.content.includes(q)
    );
  }, [flatNodes, deferredFilter]);

  return (
    <div>
      <GlassNav forumName={store.thread?.title || `帖子 #${tid}`} forumFid={fid} showBack />
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索作者/内容/楼层..."
            className="glass-input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs" />
        </div>
        <button onClick={retryFetch} className="shrink-0 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] glass-card px-2.5 py-1.5 rounded-lg transition-colors" title="刷新">
          ↻
        </button>
        {store.lastRefresh && (
          <span className="text-[10px] text-[var(--text-tertiary)]">{Math.floor((Date.now() - store.lastRefresh) / 60000)}m前</span>
        )}
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {store.thread?.title && (
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{store.thread.title}</h1>
            <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
              <span>{store.thread.author}</span>
              <span>{store.thread.replyCount} 回复</span>
              {store.totalPages > 1 && <span>{currentPage}/{store.totalPages} 页</span>}
              {store.thread.sticky && <GlassBadge variant="sticky">置顶</GlassBadge>}
              {store.thread.digest && <GlassBadge variant="digest">精华</GlassBadge>}
            </div>
          </div>
        )}

        {store.pageLoading && (
          <div className="mb-3 h-0.5 bg-[var(--border-muted)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent-blue)] animate-pulse" style={{ width: "60%" }} />
          </div>
        )}

        {store.loading ? <GlassSkeletonList count={8} />
        : store.error ? (
          <div className="text-center py-16">
            <p className="text-[var(--accent-red)] mb-4">{store.error}</p>
            <GlassButton variant="primary" onClick={retryFetch}>重试</GlassButton>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-tertiary)]">{filter ? "无匹配内容" : "暂无回复"}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ post, depth }) => (
              <div key={post.pid}>
                <PostCard post={post} isFirst={post.floor === 0 && depth === 0} depth={depth} replyTarget={post.replyTo != null ? replyMap.get(post.replyTo) || null : null} />
              </div>
            ))}
            {/* ReplyForm is a modal dialog triggered via reply-store, not inline */}
          </div>
        )}

        {store.totalPages > 1 && !store.loading && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <GlassButton variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => goPage(currentPage - 1)}>上一页</GlassButton>
            {Array.from({ length: Math.min(store.totalPages, 7) }, (_, i) => {
              let p: number;
              if (store.totalPages <= 7) p = i + 1;
              else if (currentPage <= 4) p = i + 1;
              else if (currentPage >= store.totalPages - 3) p = store.totalPages - 6 + i;
              else p = currentPage - 3 + i;
              return (
                <button key={p} onClick={() => goPage(p)}
                  className={`w-7 h-7 rounded-md text-xs font-medium border transition-colors
                    ${p === currentPage
                      ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                      : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`}>
                  {p}
                </button>
              );
            })}
            <GlassButton variant="secondary" size="sm" disabled={currentPage >= store.totalPages} onClick={() => goPage(currentPage + 1)}>下一页</GlassButton>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/forum/${fid}`} className="no-underline"><GlassButton variant="ghost" size="sm">返回板块</GlassButton></Link>
        </div>
      </div>
      {openPid !== null && (
        <ReplyForm tid={tid} fid={fid} pid={openPid} replyToAuthor={store.posts.find((p: any) => p.pid === openPid)?.author} />
      )}
    </div>
  );
}
