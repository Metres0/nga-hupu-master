import { NextRequest, NextResponse } from "next/server";
import { getCachedPosts, getThreadPageInfo } from "@/lib/cache/db";
import type { PostRow } from "@/lib/cache/db";
import { pipeline } from "@/lib/middleware/pipeline";
import { parseMaybeJson } from "@/lib/utils";

const STALE_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { tid: string } }
) {
  const piped = pipeline(async (req: Request) => {
    const tid = parseInt(params.tid);
    const page = parseInt(new URL(req.url).searchParams.get("page") || "1");
    const refresh = new URL(req.url).searchParams.get("refresh") === "1";

    const cachedPosts = getCachedPosts(tid, 0, page);
    const pageInfo = getThreadPageInfo(tid);

    const isStale = cachedPosts && cachedPosts.length > 0 && pageInfo && (Date.now() - pageInfo.reply_count > STALE_MS);
    const needsFetch = refresh || !cachedPosts || cachedPosts.length === 0 || isStale;

    if (needsFetch) {
      const { dedupedScrape } = await import("@/lib/cache/db");
      try {
        const result = await Promise.race([
          dedupedScrape(
            `thread:${tid}:${page}`,
            async () => {
              const { scrapeThreadDetail } = await import("@/lib/scraper/engine");
              const { cachePosts, updateThreadCacheTime } = await import("@/lib/cache/db");
              const data = await scrapeThreadDetail(tid, page);
              if (data && data.posts.length > 0) {
                cachePosts(data.posts, tid, page);
                updateThreadCacheTime(tid);
              }
              return data;
            }
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("scrape timeout")), 15000)
          ),
        ]);
        if (result && result.posts.length > 0) {
          return NextResponse.json(
            { thread: result.thread, posts: result.posts, totalPages: result.totalPages, cached: false },
            { headers: { "Cache-Control": "public, max-age=60" } }
          );
        }
      } catch {
        // Timeout or error: fall through to stale cache below
      }
    }

    // Serve from cache (fresh or stale degraded)
    if (cachedPosts && cachedPosts.length > 0) {
      return NextResponse.json(
        {
          thread: pageInfo ? {
            tid, title: pageInfo.title, author: pageInfo.author,
            replyCount: pageInfo.reply_count, pageCount: pageInfo.page_count,
          } : { tid },
          posts: (cachedPosts as PostRow[]).map((row) => ({
            pid: row.pid, tid: row.tid, author: row.author,
            authorId: row.author_id, content: row.content,
            contentHtml: row.content_html, createTime: row.create_time,
            replyTo: row.reply_to, floor: row.floor,
            images: parseMaybeJson(row.images),
            attachments: parseMaybeJson(row.attachments),
            likes: row.likes,
          })),
          totalPages: pageInfo?.page_count ?? 1,
          cached: true, degraded: needsFetch,
        },
        { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" } }
      );
    }

    // No cache and scrape failed
    return NextResponse.json(
      { thread: { tid }, posts: [], totalPages: 0, cached: false },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  });

  return piped(request);
}
