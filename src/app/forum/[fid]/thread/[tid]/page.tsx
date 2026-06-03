import { getCachedPosts, getThreadPageInfo } from "@/lib/cache/db";
import { getPlugin } from "@/plugins/registry";
import ThreadPageClient from "@/components/widgets/ThreadPageClient";
import AuthGate from "@/components/widgets/AuthGate";
import { getSession } from "@/lib/auth/session-store";
import { ssrCacheWrap } from "@/lib/ssr-cache";

export const revalidate = 300; // ISR: regenerate every 5 minutes

export default async function ThreadPage({ params, searchParams }: {
  params: { fid: string; tid: string };
  searchParams: { page?: string };
}) {
  const tid = parseInt(params.tid);
  const fid = parseInt(params.fid);
  const page = parseInt(searchParams.page || "1");

  const plugin = getPlugin(fid);
  const session = getSession();
  const isLoggedIn = !!(session && session.expiresAt > Date.now());

  if (plugin?.requiresLogin && !isLoggedIn) {
    return <AuthGate fid={fid} forumName={plugin?.name} />;
  }

  const cacheKey = `thread-data:${tid}:p${page}`;
  const cached = ssrCacheWrap<{ posts: any[]; pageInfo: any } | null>(
    cacheKey,
    60000,
    () => {
      const posts = getCachedPosts(tid, 0, page);
      const pageInfo = getThreadPageInfo(tid);
      return posts && posts.length > 0 && pageInfo
        ? { posts, pageInfo }
        : null;
    }
  );

  const initialPosts = cached
    ? cached.posts.map((p: any) => ({
        pid: p.pid,
        tid: p.tid,
        author: p.author,
        authorId: p.author_id,
        content: p.content,
        contentHtml: p.content_html,
        createTime: p.create_time,
        replyTo: p.reply_to,
        floor: p.floor,
        images: JSON.parse(p.images || "[]"),
        attachments: JSON.parse(p.attachments || "[]"),
        likes: p.likes || 0,
      }))
    : null;

  const threadInfo = cached?.pageInfo
    ? {
        title: cached.pageInfo.title,
        author: cached.pageInfo.author,
        replyCount: cached.pageInfo.reply_count,
        totalPages: cached.pageInfo.page_count,
      }
    : null;

  return (
    <ThreadPageClient
      tid={tid}
      fid={fid}
      page={page}
      initialPosts={initialPosts}
      threadInfo={threadInfo}
    />
  );
}
