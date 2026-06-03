import { NextRequest, NextResponse } from "next/server";
import { getCachedPosts, getThreadPageInfo } from "@/lib/cache/db";
import type { PostRow, ThreadPageInfoRow } from "@/lib/cache/db";
import { pipeline } from "@/lib/middleware/pipeline";
import { parseMaybeJson } from "@/lib/utils";

interface BatchThreadEntry {
  thread: { tid: number; title?: string; author?: string; replyCount?: number; pageCount?: number };
  posts: Array<{
    pid: number; tid: number; author: string; authorId: number; content: string;
    contentHtml: string; createTime: number; replyTo: number | null; floor: number;
    images: unknown[]; attachments: unknown[]; likes: number;
  }>;
  totalPages: number;
}

export async function GET(request: NextRequest) {
  const piped = pipeline(async (req: Request) => {
    const url = new URL(req.url);
    const tidsRaw = url.searchParams.get("tids");
    const page = parseInt(url.searchParams.get("page") || "1");

    if (!tidsRaw) {
      return NextResponse.json({ error: "Missing tids parameter" }, { status: 400 });
    }

    const tids = tidsRaw.split(",").map(Number).filter(Boolean).slice(0, 10);
    if (tids.length === 0) {
      return NextResponse.json({ threads: {} });
    }

    const result: Record<number, BatchThreadEntry> = {};
    for (const tid of tids) {
      const posts = getCachedPosts(tid, 0, page);
      const pageInfo = getThreadPageInfo(tid);
      if (posts && posts.length > 0) {
        result[tid] = {
          thread: pageInfo ? {
            tid, title: pageInfo.title, author: pageInfo.author,
            replyCount: pageInfo.reply_count, pageCount: pageInfo.page_count,
          } : { tid },
          posts: (posts as PostRow[]).map((row) => ({
            pid: row.pid, tid: row.tid, author: row.author,
            authorId: row.author_id, content: row.content,
            contentHtml: row.content_html, createTime: row.create_time,
            replyTo: row.reply_to, floor: row.floor,
            images: parseMaybeJson(row.images),
            attachments: parseMaybeJson(row.attachments),
            likes: row.likes,
          })),
          totalPages: pageInfo?.page_count ?? 1,
        };
      }
    }

    return NextResponse.json(
      { threads: result },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  });

  return piped(request);
}
