# NGA Mirror Station — Agent Guide

NGA (bbs.nga.cn) mirror built with Next.js 14 + Playwright scraper + better-sqlite3 cache. SSR-first with SWR client caching. Designed for Windows deployment.

## Developer commands

| Task | Command |
|------|---------|
| Dev server (hot reload) | `npm run dev` |
| Production build | `npm run build` |
| Start production server | `npm run start` |
| Run tests (Vitest + jsdom) | `npm run test` |
| Watch tests | `npm run test:watch` |
| Scrape single forum (FID hardcoded in script) | `npm run scrape` |
| Scrape all registered forums | `npm run scrape-all` |
| Scrape board tree (366 forums) | `npm run scrape-boards` |
| Incremental scrape | `npm run scrape-incremental` |
| Full setup (env + deps + boards) | `npm run setup` |
| Full setup with data | `npm run setup -- --full` |

**Windows shortcuts:** `setup.bat`, `start.bat`, `stop.bat` are thin wrappers around `scripts/manage.ps1`.

## Architecture & entrypoints

- **App Router SSR** (`src/app/page.tsx`, `src/app/forum/[fid]/page.tsx`, `src/app/forum/[fid]/thread/[tid]/page.tsx`): server components read SQLite directly and pass initial data to client components (`HomeClient.tsx`, `ForumPageClient.tsx`, `ThreadPageClient.tsx`). Thread detail pages inject `content_html` directly into SSR output for instant rendering.
- **ISR** (`forum/[fid]/page.tsx` revalidate=60s, `thread/[tid]/page.tsx` revalidate=300s): static HTML is cached on the local filesystem; stale pages are regenerated in background. Replaces the previous `force-dynamic` approach for better single-machine performance.
- **Client stores** (`src/store/*`): 7 Zustand stores (forum/thread/cache/ui/auth/favorite/reply). `forum-store.ts` uses `zustand/middleware` persistence for sidebar subscriptions.
- **Scraper** (`src/lib/scraper/engine.ts`): Playwright facade with full parallelization (forum-level `Promise.all`, thread-level concurrency limit 5, page-level concurrency limit 3). Fast-path circuit breaker exists but is auto-disabled because NGA blocks fetch in practice.
- **On-demand scraping** (`src/app/api/v1/forums/[fid]/route.ts`, `src/app/api/v1/threads/[tid]/route.ts`): API routes check cache staleness (5min threshold). If stale, trigger Playwright scrape inline with a 15s timeout before returning data. This replaces client-side polling in memory-constrained environments.
- **API routes** (`src/app/api/v1/*`): pipeline-wrapped (rate limiter → retry → logger → error handler). All auth routes (`/api/v1/auth/*`) use `export const dynamic = "force-dynamic"`.
- **Plugins** (`src/plugins/*`): per-forum config (name, categories, subforums, `requiresLogin`). Register in `src/plugins/registry.ts`).

## Data & scraping

- **Database**: `data/nga-cache.db` (better-sqlite3, WAL mode). Schema auto-initialized on first `getDb()` call.
- **FTS5**: virtual table `posts_fts` with auto-rebuild triggers. Search uses `src/lib/search.ts`.
- **Pre-scrape required**: site is empty without scraped data. Run `npm run scrape-all` or `npm run setup -- --full` before first dev/prod start.
- **Chrome dependency**: Playwright requires Google Chrome installed. `setup.bat` checks for it. The scraper kills orphan `chrome.exe` processes aggressively (`taskkill /F /IM chrome.exe`) to prevent zombie accumulation.
- **Composite index**: `idx_threads_fid_last_reply` on `threads(fid, last_reply_time)` for efficient incremental detection and forum listing.
- **UPSERT**: `cachePosts` uses `INSERT OR REPLACE` instead of DELETE+INSERT, halving FTS5 trigger overhead.
- **FTS5 smart rebuild**: skipped if `posts_fts` already contains data, avoiding unnecessary full-table rebuilds on startup.
- **SSR cache**: `src/lib/ssr-cache.ts` stores plain data objects (not JSX elements) for thread detail pages.

## Important constraints & quirks

### SQLite concurrency on Windows
- **WAL mode** is mandatory (`db.pragma("journal_mode = WAL")`). Do not change to DELETE or TRUNCATE.
- **`busy_timeout = 0`** is set intentionally. All writes use `withWriteRetry()` (exponential backoff with busy-wait, not `busy_timeout`).
- **`BEGIN IMMEDIATE`** is used in all write transactions (`cacheThreads`, `cachePosts`) to fail fast rather than starve readers.
- **Do not hold transactions open** across async boundaries. The scraper writes are synchronous within `withRetry` loops.

### Playwright & scraping
- Scraping is **always Playwright** (fetch fast-path exists in code but NGA blocks it in practice; circuit breaker auto-disables fast path after failures).
- `engine.ts` strips NGA JavaScript residue (`ubbcode.attach.load`, `commonui.*`) inline after extraction.
- `skipAdIfPresent()` in `browser.ts` handles NGA ad overlays before extraction.

### Environment & config
- `.env.local` is created by `setup.bat` / `manage.ps1 setup`. Key vars: `NGA_MOBILE_UA`, `RATE_LIMIT_*`, `CACHE_TTL_SECONDS`, `AUTH_RENEW_JITTER_HOURS`.
- **`AUTH_ENCRYPT_KEY`** must be set for login feature to work (AES-256-GCM cookie storage). Without it, login silently fails.
- `ENABLE_AUTO_REFRESH=1` + `REFRESH_INTERVAL_MIN=30` enables `instrumentation.ts` background scheduler (spawns `scrape-incremental.ts` via `child_process.spawn`).

### Next.js build quirks
- **`removeConsole`** is enabled in production (`next.config.js`). Do not rely on `console.log` in prod builds.
- **`serverComponentsExternalPackages`** includes `better-sqlite3` and `playwright` — these must not be bundled.
- **Bundle analyzer**: set `ANALYZE=true` before build to enable `@next/bundle-analyzer`.

### `instrumentation.ts` side effects
- Runs on Next.js startup (Node.js runtime only).
- Kills all `chrome.exe` processes before Chromium warmup.
- Sets up periodic DB maintenance (`PRAGMA optimize`, WAL checkpoint, FTS5 optimize, DB backup) via file-based PID locks (`data/locks/`).
- Auth auto-renew runs every 30 minutes if credentials are stored.

### Testing
- Vitest with `environment: "jsdom"` and `@` alias to `src/`.
- Tests live next to source: `src/**/*.test.{ts,tsx}`.
- 6 test files, 56 assertions covering: `bbcode.ts`, `reply-tree.ts`, `db.ts` (FTS5/WAL), `rate-limiter.ts`, `search.ts`, `html-cleaner.ts`.
- No special fixtures — pure logic tests.

### Style
- Tailwind CSS 3 + custom Material Design 3 color tokens in `src/app/globals.css`.
- Dark mode toggled via `data-theme="dark"` on `<html>`, with system-preference listener (`prefers-color-scheme`).
- UI components in `src/components/ui/` use `backdrop-blur` ("liquid glass"). Widgets in `src/components/widgets/` are page-level.
- Reduced motion support: `EnhancedStarryBg` canvas animation and 3D float effects respect `prefers-reduced-motion`.

## Verification checklist after changes

1. `npm run test` passes.
2. `npm run build` passes (catches SSR + dynamic import issues).
3. If touching scraper or DB: run `npm run scrape` to verify Playwright path still works.
4. If adding a new forum: create plugin → register → add to `scripts/scrape-all.ts` FORUMS list → run `npm run scrape-all`.
