import { describe, expect, it, vi } from 'vitest';
import type { ExtractionPayload } from './extractionPayloadSchema.js';
import type { CallModel } from './runCase.js';
import { runCase } from './runCase.js';

const expected: ExtractionPayload = {
  type: 'device_reading',
  measuredAt: '2026-10-05',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: 145,
  diastolic: 90,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
};

const MODEL = 'qwen/qwen3-vl-32b-instruct';
const golden = { caseId: 'may-do-01', imageBase64: 'AAAA', mimeType: 'image/jpeg', expected };
const usage = { promptTokens: 1000, completionTokens: 500 };

describe('runCase', () => {
  it('chấm điểm và ghi chi phí thực tế khi model trả JSON hợp lệ', async () => {
    const callModel = vi.fn<CallModel>().mockResolvedValue({
      content: JSON.stringify({ ...expected, pulse: 87 }),
      usage,
      costUsd: 0.002,
      latencyMs: 1500,
    });
    const result = await runCase(golden, MODEL, callModel);
    expect(result).toEqual({
      caseId: 'may-do-01',
      model: MODEL,
      score: { correct: 8, total: 9, mismatches: ['pulse'] },
      failure: null,
      costUsd: 0.002,
      latencyMs: 1500,
      output: { ...expected, pulse: 87 },
    });
  });

  it('chấm 0 điểm nhưng vẫn ghi chi phí khi model trả sai schema', async () => {
    const callModel = vi
      .fn<CallModel>()
      .mockResolvedValue({ content: '{}', usage, costUsd: 0.002, latencyMs: 900 });
    const result = await runCase(golden, MODEL, callModel);
    expect(result).toMatchObject({
      failure: 'schema_mismatch',
      score: { correct: 0 },
      costUsd: 0.002,
      output: null,
    });
  });

  it('ghi lỗi mạng, chi phí bằng 0, không dừng cả lượt chạy', async () => {
    const callModel = vi.fn<CallModel>().mockRejectedValue(new Error('HTTP 500: lỗi'));
    const result = await runCase(golden, MODEL, callModel);
    expect(result).toMatchObject({ failure: 'HTTP 500: lỗi', score: { correct: 0, total: 9 }, costUsd: 0 });
  });
});
