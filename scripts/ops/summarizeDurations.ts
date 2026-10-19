export interface DurationSummary {
  count: number;
  medianMs: number | null;
  p90Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
}

// p90 theo hạng gần nhất (nearest-rank) để luôn là một mẫu đo thật.
export function summarizeDurations(durations: readonly number[]): DurationSummary {
  const sorted = [...durations].sort((a, b) => a - b);
  const count = sorted.length;
  if (count === 0) return { count, medianMs: null, p90Ms: null, minMs: null, maxMs: null };
  const middle = Math.floor(count / 2);
  const medianMs = count % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
  return {
    count,
    medianMs,
    p90Ms: sorted[Math.ceil(count * 0.9) - 1]!,
    minMs: sorted[0]!,
    maxMs: sorted[count - 1]!,
  };
}
