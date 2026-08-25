import { describe, expect, it } from "vitest";
import { calculateScrollProgress, scrollTopForProgress } from "../src/scroll/scrollSync";

describe("scroll synchronization", () => {
  it("maps editor top, middle and bottom to normalized progress", () => {
    expect(calculateScrollProgress({ scrollTop: 0, scrollHeight: 1200, clientHeight: 200 })).toBe(0);
    expect(calculateScrollProgress({ scrollTop: 500, scrollHeight: 1200, clientHeight: 200 })).toBe(0.5);
    expect(calculateScrollProgress({ scrollTop: 1000, scrollHeight: 1200, clientHeight: 200 })).toBe(1);
  });

  it("clamps overscroll and non-finite values", () => {
    expect(calculateScrollProgress({ scrollTop: -20, scrollHeight: 1000, clientHeight: 200 })).toBe(0);
    expect(calculateScrollProgress({ scrollTop: 1200, scrollHeight: 1000, clientHeight: 200 })).toBe(1);
    expect(scrollTopForProgress(Number.NaN, 1000, 200)).toBe(0);
  });

  it("maps normalized progress to the preview scroll range", () => {
    expect(scrollTopForProgress(0, 2200, 400)).toBe(0);
    expect(scrollTopForProgress(0.5, 2200, 400)).toBe(900);
    expect(scrollTopForProgress(1, 2200, 400)).toBe(1800);
  });

  it("returns zero when either side has no scrollable range", () => {
    expect(calculateScrollProgress({ scrollTop: 50, scrollHeight: 200, clientHeight: 200 })).toBe(0);
    expect(scrollTopForProgress(0.8, 200, 300)).toBe(0);
  });
});
