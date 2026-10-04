import { describe, expect, it } from 'vitest';
import type { CaseResult } from './summarizeModel.js';
import { summarizeModel } from './summarizeModel.js';

const QWEN = 'qwen/qwen3-vl-32b-instruct';
const KIMI = 'moonshotai/kimi-k2.6';

const result = (overrides: Partial<CaseResult>): CaseResult => ({
  caseId: 'don-thuoc-01',
  model: QWEN,
  score: { correct: 7, total: 10, mismatches: [] },
  failure: null,
  costUsd: 0.001,
  latencyMs: 2000,
  output: null,
  ...overrides,
});

describe('summarizeModel', () => {
  it('tính tỷ lệ đúng trên tổng số trường của mọi ảnh (vi trung bình)', () => {
    const summary = summarizeModel(QWEN, [
      result({ score: { correct: 9, total: 10, mismatches: [] } }),
      result({ caseId: 'xet-nghiem-01', score: { correct: 21, total: 30, mismatches: [] } }),
    ]);
    expect(summary.accuracy).toBeCloseTo(0.75, 10);
  });

  it('đạt khi tỷ lệ đúng đúng bằng 70% (R1 chỉ dừng khi < 70%)', () => {
    expect(summarizeModel(QWEN, [result({})]).meetsThreshold).toBe(true);
  });

  it('không đạt khi tỷ lệ đúng dưới 70%', () => {
    const summary = summarizeModel(KIMI, [
      result({ model: KIMI, score: { correct: 69, total: 100, mismatches: [] } }),
    ]);
    expect(summary.meetsThreshold).toBe(false);
  });

  it('cộng chi phí, tính chi phí và độ trễ trung bình mỗi ảnh, đếm ảnh lỗi', () => {
    const summary = summarizeModel(QWEN, [
      result({ costUsd: 0.002, latencyMs: 1000 }),
      result({ caseId: 'may-do-01', costUsd: 0.004, latencyMs: 3000, failure: 'schema_mismatch' }),
    ]);
    expect(summary).toMatchObject({ cases: 2, failedCases: 1, avgLatencyMs: 2000 });
    expect(summary.totalCostUsd).toBeCloseTo(0.006, 10);
    expect(summary.avgCostPerImageUsd).toBeCloseTo(0.003, 10);
  });

  it('chỉ tổng hợp kết quả của đúng model được hỏi', () => {
    const summary = summarizeModel(QWEN, [result({}), result({ model: KIMI })]);
    expect(summary.cases).toBe(1);
  });
});
