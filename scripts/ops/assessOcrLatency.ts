import { summarizeDurations, type DurationSummary } from './summarizeDurations.js';
import type { OcrLatencySample } from './toOcrLatencySamples.js';

/** NFR-3/TC-095: trung vị ≤ 15 s trên 20 chứng từ thực tế. */
export const MEDIAN_LIMIT_MS = 15_000;
export const REQUIRED_DOCUMENTS = 20;

export interface OcrLatencyVerdict {
  passed: boolean;
  reasons: string[];
  /** Chỉ chứng từ có bản trích xuất (pending_review) — tập dùng cho tiêu chí. */
  withExtraction: DurationSummary;
  all: DurationSummary;
  outcomes: Record<string, number>;
}

export function assessOcrLatency(samples: readonly OcrLatencySample[]): OcrLatencyVerdict {
  const extracted = samples.filter((sample) => sample.outcome === 'pending_review');
  const withExtraction = summarizeDurations(extracted.map((sample) => sample.durationMs));
  const outcomes: Record<string, number> = {};
  for (const sample of samples) outcomes[sample.outcome] = (outcomes[sample.outcome] ?? 0) + 1;
  const reasons: string[] = [];
  if (withExtraction.count < REQUIRED_DOCUMENTS)
    reasons.push(`Mới có ${withExtraction.count}/${REQUIRED_DOCUMENTS} chứng từ có bản trích xuất`);
  if (withExtraction.medianMs !== null && withExtraction.medianMs > MEDIAN_LIMIT_MS)
    reasons.push(`Trung vị vượt ${(MEDIAN_LIMIT_MS / 1000).toFixed(1)} s`);
  return {
    passed: reasons.length === 0,
    reasons,
    withExtraction,
    all: summarizeDurations(samples.map((sample) => sample.durationMs)),
    outcomes,
  };
}
