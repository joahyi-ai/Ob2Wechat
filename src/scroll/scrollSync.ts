export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

export function calculateScrollProgress(metrics: ScrollMetrics): number {
  const maximumScroll = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  if (maximumScroll === 0) return 0;
  return clampProgress(metrics.scrollTop / maximumScroll);
}

export function scrollTopForProgress(
  progress: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const maximumScroll = Math.max(0, scrollHeight - clientHeight);
  return clampProgress(progress) * maximumScroll;
}
