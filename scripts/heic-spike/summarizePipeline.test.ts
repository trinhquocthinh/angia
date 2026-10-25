import { describe, expect, it } from 'vitest';
import type { CaseMeasurement } from './summarizePipeline.js';
import { summarizePipeline } from './summarizePipeline.js';

const ok = (caseId: string, durationMs: number, maxRssMb: number): CaseMeasurement => ({
  caseId,
  pipeline: 'heic-convert',
  result: { ok: true, durationMs, maxRssMb, width: 4032, height: 3024, outputBytes: 500_000 },
});

describe('summarizePipeline', () => {
  it('tính trung bình/lớn nhất và đạt khi mọi ảnh < 30 s và RAM đỉnh < 512 MB (Tech Spec R4)', () => {
    const summary = summarizePipeline('heic-convert', [
      ok('a', 4000, 300),
      ok('b', 6000, 420),
      { ...ok('x', 1, 1), pipeline: 'khac' },
    ]);

    expect(summary).toEqual({
      pipeline: 'heic-convert',
      cases: 2,
      succeeded: 2,
      avgDurationMs: 5000,
      maxDurationMs: 6000,
      maxRssMb: 420,
      meetsThreshold: true,
    });
  });

  it('không đạt khi có ảnh xử lý quá 30 s', () => {
    expect(summarizePipeline('heic-convert', [ok('a', 30_001, 200)]).meetsThreshold).toBe(false);
  });

  it('không đạt khi RAM đỉnh chạm mem_limit 512 MB của worker', () => {
    expect(summarizePipeline('heic-convert', [ok('a', 1000, 512)]).meetsThreshold).toBe(false);
  });

  it('không đạt khi có ảnh chuyển đổi thất bại; RAM vẫn tính cả lượt lỗi', () => {
    const failed: CaseMeasurement = {
      caseId: 'b',
      pipeline: 'heic-convert',
      result: { ok: false, durationMs: 10, maxRssMb: 600, error: 'boom' },
    };

    const summary = summarizePipeline('heic-convert', [ok('a', 1000, 200), failed]);

    expect(summary).toMatchObject({
      cases: 2,
      succeeded: 1,
      avgDurationMs: 1000,
      maxRssMb: 600,
      meetsThreshold: false,
    });
  });

  it('trả null cho thời gian khi không ảnh nào thành công', () => {
    const failed: CaseMeasurement = {
      caseId: 'a',
      pipeline: 'sharp-native',
      result: { ok: false, durationMs: 5, maxRssMb: 90, error: 'no decoder' },
    };

    expect(summarizePipeline('sharp-native', [failed])).toMatchObject({
      succeeded: 0,
      avgDurationMs: null,
      maxDurationMs: null,
      meetsThreshold: false,
    });
  });
});
