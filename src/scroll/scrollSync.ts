export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface ScrollSyncPoint {
  source: number;
  target: number;
}

export interface ContentAnchorPair {
  sourceTop: number;
  targetTop: number;
}

export interface SourceAnchorGeometry {
  sourceOffset: number;
  sourceTop: number;
}

export interface SourceScrollGeometry extends ScrollMetrics {
  anchors: SourceAnchorGeometry[];
}

const ANCHOR_VIEWPORT_POSITION = 0.2;

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export function maximumScroll(metrics: Pick<ScrollMetrics, "scrollHeight" | "clientHeight">): number {
  return Math.max(0, metrics.scrollHeight - metrics.clientHeight);
}

export function calculateScrollProgress(metrics: ScrollMetrics): number {
  const maximum = maximumScroll(metrics);
  if (maximum === 0) return 0;
  return clamp(metrics.scrollTop / maximum, 0, 1);
}

export function scrollTopForProgress(
  progress: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const maximum = maximumScroll({ scrollHeight, clientHeight });
  return clamp(progress, 0, 1) * maximum;
}

function normalizePoints(points: ScrollSyncPoint[]): ScrollSyncPoint[] {
  const sorted = points
    .filter((point) => Number.isFinite(point.source) && Number.isFinite(point.target))
    .sort((left, right) => left.source - right.source || left.target - right.target);
  const normalized: ScrollSyncPoint[] = [];

  sorted.forEach((point) => {
    const previous = normalized[normalized.length - 1];
    if (previous && Math.abs(previous.source - point.source) < 0.5) {
      previous.target = Math.min(previous.target, point.target);
      return;
    }
    normalized.push({ ...point });
  });

  let lastTarget = 0;
  normalized.forEach((point, index) => {
    point.target = index === 0 ? point.target : Math.max(lastTarget, point.target);
    lastTarget = point.target;
  });
  return normalized;
}

export function createScrollSyncPoints(
  sourceMetrics: ScrollMetrics,
  targetMetrics: ScrollMetrics,
  anchors: ContentAnchorPair[],
): ScrollSyncPoint[] {
  const sourceMaximum = maximumScroll(sourceMetrics);
  const targetMaximum = maximumScroll(targetMetrics);
  const points: ScrollSyncPoint[] = [{ source: 0, target: 0 }];

  anchors.forEach((anchor) => {
    const source = clamp(
      anchor.sourceTop - sourceMetrics.clientHeight * ANCHOR_VIEWPORT_POSITION,
      0,
      sourceMaximum,
    );
    const target = clamp(
      anchor.targetTop - targetMetrics.clientHeight * ANCHOR_VIEWPORT_POSITION,
      0,
      targetMaximum,
    );
    const touchesBoundary = source < 0.5
      || source > sourceMaximum - 0.5
      || target < 0.5
      || target > targetMaximum - 0.5;
    if (!touchesBoundary) points.push({ source, target });
  });

  points.push({ source: sourceMaximum, target: targetMaximum });
  return normalizePoints(points);
}

export function interpolateScrollPosition(value: number, points: ScrollSyncPoint[]): number {
  const normalized = normalizePoints(points);
  if (normalized.length === 0) return 0;
  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (!first || !last) return 0;
  if (normalized.length === 1) return first.target;

  const clampedValue = clamp(value, first.source, last.source);
  for (let index = 1; index < normalized.length; index += 1) {
    const right = normalized[index];
    const left = normalized[index - 1];
    if (!right || !left) continue;
    if (clampedValue > right.source) continue;
    const distance = right.source - left.source;
    if (distance <= 0) return right.target;
    const progress = (clampedValue - left.source) / distance;
    return left.target + (right.target - left.target) * progress;
  }

  return last.target;
}

export function reverseScrollSyncPoints(points: ScrollSyncPoint[]): ScrollSyncPoint[] {
  return normalizePoints(points.map((point) => ({ source: point.target, target: point.source })));
}
