import { describe, expect, it } from "vitest";
import {
  calculateScrollProgress,
  createScrollSyncPoints,
  interpolateScrollPosition,
  reverseScrollSyncPoints,
  scrollTopForProgress,
} from "../src/scroll/scrollSync";

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

  it("uses content anchors instead of a global height ratio", () => {
    const points = createScrollSyncPoints(
      { scrollTop: 0, scrollHeight: 2200, clientHeight: 200 },
      { scrollTop: 0, scrollHeight: 1400, clientHeight: 200 },
      [
        { sourceTop: 600, targetTop: 500 },
        { sourceTop: 1600, targetTop: 900 },
      ],
    );

    expect(interpolateScrollPosition(560, points)).toBe(460);
    expect(interpolateScrollPosition(1560, points)).toBe(860);
    expect(interpolateScrollPosition(2000, points)).toBe(1200);
  });

  it("reverses the same anchor mapping for preview-to-editor scrolling", () => {
    const points = createScrollSyncPoints(
      { scrollTop: 0, scrollHeight: 2200, clientHeight: 200 },
      { scrollTop: 0, scrollHeight: 1400, clientHeight: 200 },
      [
        { sourceTop: 600, targetTop: 500 },
        { sourceTop: 1600, targetTop: 900 },
      ],
    );
    const previewTop = interpolateScrollPosition(1000, points);
    const editorTop = interpolateScrollPosition(previewTop, reverseScrollSyncPoints(points));
    expect(editorTop).toBeCloseTo(1000, 5);
  });

  it("clamps both directions to their actual scroll ranges", () => {
    const points = createScrollSyncPoints(
      { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 },
      { scrollTop: 0, scrollHeight: 600, clientHeight: 200 },
      [],
    );
    expect(interpolateScrollPosition(-100, points)).toBe(0);
    expect(interpolateScrollPosition(5000, points)).toBe(400);
  });

  it("preserves the exact top endpoint when an anchor also starts at zero", () => {
    const points = createScrollSyncPoints(
      { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 },
      { scrollTop: 0, scrollHeight: 800, clientHeight: 200 },
      [{ sourceTop: 0, targetTop: 140 }],
    );
    expect(points[0]).toEqual({ source: 0, target: 0 });
    expect(interpolateScrollPosition(0, points)).toBe(0);
    expect(interpolateScrollPosition(0, reverseScrollSyncPoints(points))).toBe(0);
  });

  it("preserves the exact bottom endpoint when the last anchor reaches the boundary", () => {
    const points = createScrollSyncPoints(
      { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 },
      { scrollTop: 0, scrollHeight: 800, clientHeight: 200 },
      [{ sourceTop: 990, targetTop: 580 }],
    );
    expect(points[points.length - 1]).toEqual({ source: 800, target: 600 });
    expect(interpolateScrollPosition(800, points)).toBe(600);
    expect(interpolateScrollPosition(600, reverseScrollSyncPoints(points))).toBe(800);
  });
});
