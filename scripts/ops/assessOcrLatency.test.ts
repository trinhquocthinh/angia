import { describe, expect, it } from 'vitest';
import { assessOcrLatency } from './assessOcrLatency.js';
import type { OcrLatencySample } from './toOcrLatencySamples.js';

const sample = (durationMs: number, outcome = 'pending_review'): OcrLatencySample => ({
  documentId: `doc-${durationMs}`,
  outcome,
  retryCount: 0,
  queueWaitMs: 100,
  durationMs,
});
const times = (count: number, durationMs: number) =>
  Array.from({ length: count }, (_, index) => sample(durationMs + index));

describe('assessOcrLatency', () => {
  it('TC-095 đạt khi có ≥ 20 chứng từ có bản trích xuất và trung vị ≤ 15 s', () => {
    const verdict = assessOcrLatency(times(20, 14_000));
    expect(verdict.passed).toBe(true);
    expect(verdict.withExtraction.count).toBe(20);
  });

  it('TC-095 không đạt khi trung vị vượt 15 s', () => {
    const verdict = assessOcrLatency(times(20, 15_001));
    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContain('Trung vị vượt 15.0 s');
  });

  it('TC-095 không đạt khi chưa đủ 20 chứng từ có bản trích xuất', () => {
    const verdict = assessOcrLatency([...times(19, 5_000), sample(1_000, 'manual_entry')]);
    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toContain('Mới có 19/20 chứng từ có bản trích xuất');
  });

  it('TC-095 chỉ tính pending_review vào tiêu chí; mọi mẫu vẫn được thống kê riêng', () => {
    const verdict = assessOcrLatency([...times(20, 2_000), sample(90_000, 'manual_entry')]);
    expect(verdict.withExtraction.maxMs).toBe(2_019);
    expect(verdict.all.maxMs).toBe(90_000);
    expect(verdict.outcomes).toEqual({ pending_review: 20, manual_entry: 1 });
  });
});
