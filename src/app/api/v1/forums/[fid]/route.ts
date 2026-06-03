import { NextRequest, NextResponse } from "next/server";
import { getCachedThreadsSlim, getCachedThreadCount } from "@/lib/cache/db";
import { getPlugin } from "@/plugins/registry";
import { pipeline } from "@/lib/middleware/pipeline";

const STALE_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  const piped = pipeline(async (req: Request) => {
    const fid = parseInt(params.fid);
    const page = parseInt(new URL(req.url).searchParams.get("page") || "1");
    const refresh = new URL(req.url).searchParams.get("refresh") === "1";
    const perPage = 30;
    const offset = (page - 1) * perPage;

    const cached = getCachedThreadsSlim(fid, perPage, offset);
    const totalCount = getCachedThreadCount(fid);
    const plugin = getPlugin(fid);

    const isStale = cached.length > 0 && (Date.now() - (cached[0]?.last_reply_time ?? 0) > STALE_MS);
    const needsFetch = refresh || cached.length === 0 || isStale;

    if (needsFetch) {
      // On-demand scrape with 15s timeout
      const { dedupedScrape } = await import("@/lib/cache/db");
      try {
        const result = await Promise.race([
          dedupedScrape(
            `forum:${fid}:${page}`,
            async () => {
              const { scrapeThreadList } = await import("@/lib/scraper/engine");
              const { cacheThreads } = await import("@/lib/cache/db");
              const data = await scrapeThreadList(fid, page);
              if (data.threads.length > 0) cacheThreads(data.threads);
              return data;
            }
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("scrape timeout")), 15000)
          ),
        ]);
        if (result.threads.length > 0) {
          const totalPages = Math.max(Math.ceil(result.threads.length / perPage), result.totalPages);
          return NextResponse.json(
            {
              data: result.threads.map((t: any) => ({
                tid: t.tid, title: t.title, author: t.author,
                createTime: t.createTime ?? t.create_time,
                lastReplyTime: t.lastReplyTime ?? t.last_reply_time,
                replyCount: t.replyCount ?? t.reply_count,
                sticky: !!t.sticky, digest: !!t.digest,
              })),
              page, totalPages, hasMore: page < totalPages,
              forum: { fid, name: result.forumName, subForums: result.subForums },
              cached: false,
            },
            { headers: { "Cache-Control": "public, max-age=120" } }
          );
        }
      } catch {
        // Timeout or error: fall through to stale cache below
      }
    }

    // Serve from cache (fresh or stale degraded)
    if (cached && cached.length > 0) {
      const totalPages = Math.max(Math.ceil(totalCount / perPage), 1);
      return NextResponse.json(
        {
          data: cached.map((row) => ({
            tid: row.tid, title: row.title,
            author: row.author,
            createTime: row.create_time, lastReplyTime: row.last_reply_time,
            replyCount: row.reply_count, sticky: !!row.sticky,
            digest: !!row.digest,
          })),
          page, totalPages, hasMore: page < totalPages,
          forum: plugin || { fid, name: `板块 ${fid}`, subForums: [] },
          cached: true, degraded: needsFetch,
        },
        { headers: { "Cache-Control": "public, max-age=60" } }
      );
    }

    // Absolute fallback: no cache and scrape failed
    return NextResponse.json(
      { data: [], page, totalPages: 1, hasMore: false, forum: plugin || { fid, name: `板块 ${fid}`, subForums: [] }, cached: false },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  });

  return piped(request);
}
