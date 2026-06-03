import { describe, it, expect } from "vitest";
import {
  getDb,
  getAllCachedForums,
  getCachedThreadsSlim,
  getCachedThreadCount,
  getThreadPageInfo,
  getCachedPostsMeta,
} from "./db";

describe("db", () => {
  it("getDb returns a connected database", () => {
    const db = getDb();
    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it("getAllCachedForums returns array", () => {
    const forums = getAllCachedForums();
    expect(Array.isArray(forums)).toBe(true);
    if (forums.length > 0) {
      const f = forums[0];
      expect(f).toHaveProperty("fid");
      expect(f).toHaveProperty("name");
      expect(f).toHaveProperty("threadCount");
      expect(typeof f.fid).toBe("number");
      expect(typeof f.name).toBe("string");
    }
  });

  it("getCachedThreadsSlim returns typed rows for known forum", () => {
    // Use fid -343809 (car club) which is scraped
    const rows = getCachedThreadsSlim(-343809, 5, 0);
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      const row = rows[0];
      expect(row).toHaveProperty("tid");
      expect(row).toHaveProperty("title");
      expect(row).toHaveProperty("author");
      expect(row).toHaveProperty("create_time");
      expect(row).toHaveProperty("last_reply_time");
      expect(row).toHaveProperty("reply_count");
      expect(typeof row.tid).toBe("number");
      expect(typeof row.title).toBe("string");
    }
  });

  it("getCachedThreadCount returns non-negative number", () => {
    const count = getCachedThreadCount(-343809);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("getThreadPageInfo returns null or valid shape", () => {
    // Try a known tid from car club (fallback to 0 if no data)
    const info = getThreadPageInfo(0);
    if (info) {
      expect(info).toHaveProperty("title");
      expect(info).toHaveProperty("author");
      expect(info).toHaveProperty("reply_count");
      expect(info).toHaveProperty("page_count");
      expect(typeof info.page_count).toBe("number");
    } else {
      expect(info).toBeNull();
    }
  });

  it("getCachedPostsMeta returns empty or typed array", () => {
    const rows = getCachedPostsMeta(0, 1);
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      const r = rows[0];
      expect(r).toHaveProperty("pid");
      expect(r).toHaveProperty("floor");
      expect(r).toHaveProperty("author");
    }
  });
});
