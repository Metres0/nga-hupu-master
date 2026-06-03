const cache = new Map<string, { data: unknown; ts: number }>();
const MAX_SIZE = 200;

export function ssrCacheGet<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) { cache.delete(key); return null; }
  return entry.data as T;
}

export function ssrCacheSet(key: string, data: unknown): void {
  if (cache.size >= MAX_SIZE) {
    const oldest = [...cache.entries()].reduce((a, b) => (a[1].ts < b[1].ts ? a : b));
    cache.delete(oldest[0]);
  }
  cache.set(key, { data, ts: Date.now() });
}

export function ssrCacheWrap<T>(key: string, ttlMs: number, fn: () => T): T {
  const cached = ssrCacheGet<T>(key, ttlMs);
  if (cached !== null) return cached;
  const result = fn();
  ssrCacheSet(key, result);
  return result;
}
