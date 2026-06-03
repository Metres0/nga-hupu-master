/**
 * Multi-forum scraper with full parallelism.
 * Parallel levels: forums -> threads -> pages (within each thread).
 */
import {
  scrapeThreadList,
  scrapeThreadDetail,
  closeBrowser,
} from "../src/lib/scraper/engine";
import { cacheThreads, cachePosts } from "../src/lib/cache/db";

import { execSync } from "child_process";
try { execSync("taskkill /F /IM chrome.exe 2>nul", { stdio: "ignore" }); } catch {}

const FORUMS = [
  { fid: -343809, name: "汽车俱乐部" },
  { fid: -576177, name: "音乐影视" },
  { fid: -7955747, name: "晴风村" },
];

const MAX_THREAD_PAGES = 2;
const MAX_DETAIL_THREADS = 100;
const CONCURRENCY = 5;

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

async function scrapeForum(fid: number, name: string) {
  console.log(`\n=== ${name} (FID=${fid}) ===`);
  let allThreads: any[] = [];

  // Scrape list pages
  for (let page = 1; page <= MAX_THREAD_PAGES; page++) {
    console.log(`[${page}/${MAX_THREAD_PAGES}] 抓取板块列表...`);
    const result = await scrapeThreadList(fid, page);
    console.log(`  → ${result.threads.length} 帖, 论坛: ${result.forumName}`);
    allThreads.push(...result.threads);
    if (page >= result.totalPages) break;
  }

  console.log(`总计 ${allThreads.length} 个帖子`);
  cacheThreads(allThreads);

  const threadsWithReplies = allThreads
    .filter((t) => t.replyCount > 0 && !t.sticky)
    .slice(0, MAX_DETAIL_THREADS);

  console.log(`抓取 ${threadsWithReplies.length} 个帖子详情(含多页)...`);

  const detailTasks = threadsWithReplies.map((t) => async () => {
    const totalPages = Math.min(Math.ceil(t.replyCount / 20), 5);
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
    }
    return { tid: t.tid, success: allPosts.length > 0, postCount: allPosts.length };
  });

  const results = await withConcurrencyLimit(detailTasks, CONCURRENCY);
  const successCount = results.filter((r) => r.success).length;
  console.log(`  → ${name} 完成 (成功 ${successCount}/${threadsWithReplies.length})`);
}

async function main() {
  console.log("=== NGA 多板块预抓取 (并行版) ===");
  await Promise.all(FORUMS.map((f) => scrapeForum(f.fid, f.name)));
  await closeBrowser();
  console.log("\n=== 全部完成 ===\n启动: npm run start");
}

main().catch((err) => {
  console.error("失败:", err);
  process.exit(1);
});
