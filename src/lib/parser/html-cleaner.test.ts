import { describe, it, expect } from "vitest";
import { cleanNgaHtml } from "./html-cleaner";

describe("cleanNgaHtml", () => {
  it("removes ubbcode.attach.load calls", () => {
    const input = 'before ubbcode.attach.load(123, "abc") after';
    expect(cleanNgaHtml(input)).toBe("before after");
  });

  it("handles nested parentheses in ubbcode.attach.load", () => {
    const input = 'ubbcode.attach.load(123, fn(1,2)) tail';
    expect(cleanNgaHtml(input)).toBe("tail");
  });

  it("removes 显示全部附件", () => {
    expect(cleanNgaHtml("点击显示全部附件")).toBe("点击");
  });

  it("removes commonui calls", () => {
    const input = 'before commonui.postArguesCheck(123); after';
    expect(cleanNgaHtml(input)).toBe("before after");
  });

  it("removes 改动在 date 修改", () => {
    const input = "帖子改动在2024-01-01 12:00修改结束";
    expect(cleanNgaHtml(input)).toBe("帖子结束");
  });

  it("removes floor-time-id stamps", () => {
    const input = "reply #1 2024-01-01 12:00 12345 tail";
    expect(cleanNgaHtml(input)).toBe("reply tail");
  });

  it("returns plain text unchanged", () => {
    expect(cleanNgaHtml("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(cleanNgaHtml("")).toBe("");
  });
});
