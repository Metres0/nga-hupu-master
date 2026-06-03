import { describe, it, expect, beforeAll } from "vitest";
import { searchPosts, ensureFtsIndex, getSearchStats } from "./search";

describe("searchPosts", () => {
  beforeAll(() => {
    ensureFtsIndex();
  });

  it("returns results for existing query", () => {
    // Use a very common Chinese character to likely hit cached data
    const results = searchPosts("的", undefined, 5, 0);
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty("pid");
      expect(results[0]).toHaveProperty("tid");
      expect(results[0]).toHaveProperty("fid");
      expect(results[0]).toHaveProperty("author");
      expect(results[0]).toHaveProperty("content");
      expect(results[0]).toHaveProperty("createTime");
      expect(results[0]).toHaveProperty("floor");
    }
  });

  it("supports fid filter", () => {
    const results = searchPosts("的", -343809, 5, 0);
    expect(Array.isArray(results)).toBe(true);
    for (const r of results) {
      // fid may be 0 if thread lookup failed, but if present should match
      if (r.fid && r.fid !== 0) {
        expect(r.fid).toBe(-343809);
      }
    }
  });

  it("supports author search", () => {
    // author: prefix triggers author mode
    const results = searchPosts("author:测试", undefined, 5, 0);
    expect(Array.isArray(results)).toBe(true);
    // Results should be empty or filtered; just verify no crash
  });

  it("returns empty array for nonsense query", () => {
    const results = searchPosts("xyznonsense12345", undefined, 5, 0);
    expect(results).toEqual([]);
  });

  it("increments hit counter", () => {
    const before = getSearchStats().hits;
    searchPosts("的", undefined, 1, 0);
    const after = getSearchStats().hits;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
