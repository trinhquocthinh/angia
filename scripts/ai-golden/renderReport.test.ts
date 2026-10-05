import { describe, expect, it } from 'vitest';
import { renderReport } from './renderReport.js';
import type { CaseResult } from './summarizeModel.js';
import { summarizeModel } from './summarizeModel.js';

const QWEN = 'qwen/qwen3-vl-32b-instruct';
const KIMI = 'moonshotai/kimi-k2.6';

const results: CaseResult[] = [
  {
    caseId: 'don-thuoc-01',
    model: QWEN,
    score: { correct: 9, total: 11, mismatches: ['items[0].slots', 'facility'] },
    failure: null,
    costUsd: 0.00042,
    latencyMs: 1830,
    output: null,
  },
  {
    caseId: 'don-thuoc-01',
    model: KIMI,
    score: { correct: 0, total: 11, mismatches: ['*'] },
    failure: 'schema_mismatch',
    costUsd: 0.0051,
    latencyMs: 9120,
    output: null,
  },
];

const report = renderReport({
  generatedAt: '2026-10-05T01:00:00.000Z',
  summaries: [summarizeModel(QWEN, results), summarizeModel(KIMI, results)],
  results,
});

describe('renderReport', () => {
  it('có dòng tổng hợp mỗi model với tỷ lệ đúng và kết luận ngưỡng 70%', () => {
    expect(report).toContain(`| ${QWEN} | 1 | 0 | 9/11 | 81.8% | ✅ Đạt |`);
    expect(report).toContain(`| ${KIMI} | 1 | 1 | 0/11 | 0.0% | ❌ Dưới 70% |`);
  });

  it('ghi chi phí USD và độ trễ trung bình', () => {
    expect(report).toContain('$0.000420');
    expect(report).toContain('1830 ms');
  });

  it('liệt kê trường sai và lý do thất bại của từng ảnh', () => {
    expect(report).toContain(`| don-thuoc-01 | ${QWEN} | 9/11 | items[0].slots, facility |`);
    expect(report).toContain(`| don-thuoc-01 | ${KIMI} | 0/11 | schema_mismatch |`);
  });
});
