import { Suspense } from "react";
import { searchPosts } from "@/lib/search";
import SearchContent from "./SearchContent";
import { GlassSkeleton } from "@/components/ui/GlassSkeleton";

interface SearchPageProps {
  searchParams: { q?: string; fid?: string };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const initialQ = searchParams.q || "";
  const initialFid = searchParams.fid || "";

  let initialResults: Array<{
    pid: number;
    tid: number;
    fid: number;
    author: string;
    content: string;
    createTime: number;
    floor: number;
  }> = [];
  let initialTotal = 0;
  let initialHasMore = false;

  if (initialQ) {
    try {
      const fidNum = initialFid ? parseInt(initialFid) : undefined;
      const rows = searchPosts(initialQ, fidNum, 30, 0);
      initialResults = rows.map((r) => ({
        pid: r.pid,
        tid: r.tid,
        fid: r.fid ?? 0,
        author: r.author,
        content: r.content,
        createTime: r.createTime,
        floor: r.floor,
      }));
      initialTotal = rows.length;
      initialHasMore = rows.length >= 30;
    } catch {
      // Degrade to empty on SSR failure; client will retry
    }
  }

  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-5 py-12"><GlassSkeleton className="h-48 rounded-2xl" /></div>}>
      <SearchContent
        initialQ={initialQ}
        initialFid={initialFid}
        initialResults={initialResults}
        initialTotal={initialTotal}
        initialHasMore={initialHasMore}
      />
    </Suspense>
  );
}
