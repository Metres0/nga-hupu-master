import { describe, it, expect, beforeEach } from "vitest";
import {
  acquireSlot,
  releaseSlot,
  getStats,
  resetForTest,
} from "./rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    resetForTest();
  });

  it("allows requests under concurrent limit", async () => {
    await acquireSlot();
    expect(getStats().activeCount).toBe(1);
    releaseSlot();
    expect(getStats().activeCount).toBe(0);
  });

  it("queues requests when concurrent limit exceeded", async () => {
    const limit = parseInt(process.env.RATE_LIMIT_MAX_CONCURRENT || "3");
    // Fill up to limit
    const slots: Promise<void>[] = [];
    for (let i = 0; i < limit; i++) {
      slots.push(acquireSlot());
    }
    await Promise.all(slots);
    expect(getStats().activeCount).toBe(limit);
    expect(getStats().waitingCount).toBe(0);

    // Next request should queue
    let acquired = false;
    const queued = acquireSlot().then(() => {
      acquired = true;
    });
    expect(getStats().waitingCount).toBe(1);

    // Release one slot, queued request should acquire
    releaseSlot();
    await queued;
    expect(acquired).toBe(true);
    expect(getStats().waitingCount).toBe(0);

    // Cleanup remaining slots
    for (let i = 0; i < limit; i++) {
      releaseSlot();
    }
  });

  it("respects max per window", async () => {
    // Default max per window is 10; acquire 10 quickly should work,
    // the 11th should reject.
    for (let i = 0; i < 10; i++) {
      await acquireSlot(); // eslint-disable-line no-await-in-loop
      releaseSlot();
    }
    // 10th releaseSlot decrements activeCount but windowRequests stays 10
    await expect(acquireSlot()).rejects.toThrow("请求频率过快");
  });

  it("getStats returns correct shape", () => {
    const stats = getStats();
    expect(stats).toHaveProperty("activeCount");
    expect(stats).toHaveProperty("windowRequests");
    expect(stats).toHaveProperty("windowStart");
    expect(stats).toHaveProperty("concurrentLimit");
    expect(stats).toHaveProperty("maxPerWindow");
    expect(stats).toHaveProperty("waitingCount");
  });
});
