/**
 * Incremental scraper with full parallelism.
 * Parallel levels: forums -> threads -> pages (within each thread).
 */
import {
  scrapeThreadList,
  scrapeThreadDetail,
  closeBrowser,
} from "../src/lib/scraper/engine";
import { cacheThreads, cachePosts, tryAcquireScrapeLock, releaseScrapeLock } from "../src/lib/cache/db";

import { execSync } from "child_process";
try { execSync("taskkill /F /IM chrome.exe 2>nul", { stdio: "ignore" }); } catch {}

const FORUMS = (() => {
  const priority = (process.env.PRIORITY_FIDS || "").split(",").filter(Boolean).map(Number);
  const defaults = [
    { fid: -343809, name: "汽车俱乐部" },
    { fid: -576177, name: "音乐影视" },
  ];
  if (priority.length > 0) {
    const merged = priority.map((fid) => {
      const found = defaults.find((d) => d.fid === fid);
      return { fid, name: found?.name || `板块 ${fid}` };
    });
    defaults.forEach((d) => { if (!merged.find((m) => m.fid === d.fid)) merged.push(d); });
    return merged;
  }
  return defaults;
})();

const MAX_THREAD_PAGES = 2;
const MAX_DETAIL_THREADS = 20;
const CONCURRENCY = 5;

/** Simple promise-based concurrency limiter */
async function withConcurrencyLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  let index = 0;

  for (const task of tasks) {
    const p = task().then((r) => { results[index++] = r; });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((x) => x === p), 1);
    }
  }
  await Promise.all(executing);
  return results;
}

async function scrapeForumIncremental(fid: number, name: string) {
  console.log(`\n=== ${name} (FID=${fid}) 增量抓取 ===`);

  const { getCachedThreads } = await import("../src/lib/cache/db");
  const existing = getCachedThreads(fid);
  const existingMap = new Map(existing.map((t: any) => [t.tid, t]));

  // 1. Scrape list pages sequentially (usually only 2 pages, fast enough)
  let allThreads: any[] = [];
  for (let page = 1; page <= MAX_THREAD_PAGES; page++) {
    const result = await scrapeThreadList(fid, page);
    console.log(`  第${page}页: ${result.threads.length} 帖`);
    allThreads.push(...result.threads);
    if (page >= result.totalPages) break;
  }

  // Detect new threads AND updated threads (reply_count / last_reply_time changed)
  const newOrUpdated = allThreads.filter((t) => {
    const old = existingMap.get(t.tid);
    if (!old) return true;
    const oldReplyCount = old.reply_count ?? old.replyCount ?? 0;
    const oldLastReply = old.last_reply_time ?? old.lastReplyTime ?? 0;
    return t.replyCount !== oldReplyCount || t.lastReplyTime > oldLastReply;
  });

  console.log(`  新帖/更新: ${newOrUpdated.length}, 已有: ${existingMap.size}`);

  if (newOrUpdated.length > 0 || allThreads.length > existingMap.size) {
    cacheThreads(allThreads);
  }

  // 2. Parallel detail scraping (posts + pages within each thread)
  const threadsToFetch = allThreads
    .filter((t) => t.replyCount > 0 && !t.sticky)
    .slice(0, MAX_DETAIL_THREADS);

  const detailTasks = threadsToFetch.map((t) => async () => {
    const totalPages = Math.min(Math.ceil(t.replyCount / 20), 5);
    const lockKey = `scrape:${t.tid}`;
    const lockTtl = Math.max(30000, totalPages * 8000);
    if (!tryAcquireScrapeLock(lockKey, lockTtl)) {
      console.log(`  跳 TID=${t.tid} (已被其他进程抓取)`);
      return { tid: t.tid, success: false };
    }

    const allPosts: any[] = [];
    try {
      // Parallel page fetching within a single thread
      const pageTasks = Array.from({ length: totalPages }, (_, i) => i + 1).map(
        (p) => () => scrapeThreadDetail(t.tid, p)
      );
      const pageResults = await withConcurrencyLimit(pageTasks, Math.min(3, totalPages));

      for (let pi = 0; pi < pageResults.length; pi++) {
        const detail = pageResults[pi];
        if (detail && detail.posts.length > 0) {
          cachePosts(detail.posts, t.tid, pi + 1);
          allPosts.push(...detail.posts);
        }
      }
    } catch (e: any) {
      console.log(`  TID=${t.tid} 失败: ${e.message}`);
    } finally {
      releaseScrapeLock(lockKey);
    }
    return { tid: t.tid, success: allPosts.length > 0, postCount: allPosts.length };
  });

  const results = await withConcurrencyLimit(detailTasks, CONCURRENCY);
  const successCount = results.filter((r) => r.success).length;
  console.log(`  -> ${name} 完成 (成功 ${successCount}/${threadsToFetch.length})`);
}

async function main() {
  console.log("=== NGA 增量抓取 (并行版) ===");
  // Parallel across forums
  await Promise.all(FORUMS.map((f) => scrapeForumIncremental(f.fid, f.name)));
  await closeBrowser();
  console.log("\n=== 增量抓取完成 ===");
}

main().catch((err) => {
  console.error("失败:", err);
  process.exit(1);
});
