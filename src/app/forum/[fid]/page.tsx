import { getCachedThreadsSlim, getCachedThreadCount } from "@/lib/cache/db";
import { getPlugin } from "@/plugins/registry";
import ForumPageClient from "@/components/widgets/ForumPageClient";
import AuthGate from "@/components/widgets/AuthGate";
import { getSession } from "@/lib/auth/session-store";
import { ssrCacheWrap } from "@/lib/ssr-cache";

export const revalidate = 60; // ISR: regenerate every 60s

export default async function ForumPage({ params }: { params: { fid: string } }) {
  const fid = parseInt(params.fid);
  const plugin = getPlugin(fid);
  const session = getSession();
  const isLoggedIn = !!(session && session.expiresAt > Date.now());

  if (plugin?.requiresLogin && !isLoggedIn) {
    return <AuthGate fid={fid} forumName={plugin?.name} />;
  }

  const cacheKey = `forum-data:${fid}:p1`;
  const cached = ssrCacheWrap<{ rows: any[]; totalCount: number } | null>(
    cacheKey,
    30000,
    () => {
      const perPage = 30;
      const rows = getCachedThreadsSlim(fid, perPage, 0);
      const totalCount = getCachedThreadCount(fid);
      return rows.length > 0 ? { rows, totalCount } : null;
    }
  );

  const initialData = cached
    ? cached.rows.map((row: any) => ({
        tid: row.tid, title: row.title, author: row.author,
        createTime: row.create_time, lastReplyTime: row.last_reply_time,
        replyCount: row.reply_count, sticky: !!row.sticky,
        digest: !!row.digest,
      }))
    : null;
  const meta = {
    totalPages: Math.max(Math.ceil((cached?.totalCount ?? 0) / 30), 1),
    forumName: plugin?.name || `板块 ${fid}`,
  };

  return <ForumPageClient fid={fid} initialThreads={initialData} initialMeta={meta} />;
}
