import { describe, expect, it } from 'vitest';
import { renderSpikeReport } from './renderSpikeReport.js';

const environment = { node: 'v22.12.0', platform: 'darwin arm64', cpu: 'Apple M2', totalMemGb: 16 };

describe('renderSpikeReport', () => {
  it('in môi trường đo, bảng tổng hợp theo pipeline và chi tiết từng ảnh', () => {
    const report = renderSpikeReport({
      generatedAt: '2026-10-05T08:00:00.000Z',
      environment,
      summaries: [
        {
          pipeline: 'heic-convert',
          cases: 1,
          succeeded: 1,
          avgDurationMs: 4200,
          maxDurationMs: 4200,
          maxRssMb: 310.4,
          meetsThreshold: true,
        },
        {
          pipeline: 'sharp-native',
          cases: 1,
          succeeded: 0,
          avgDurationMs: null,
          maxDurationMs: null,
          maxRssMb: 90,
          meetsThreshold: false,
        },
      ],
      measurements: [
        {
          caseId: 'iphone-01',
          pipeline: 'heic-convert',
          result: {
            ok: true,
            durationMs: 4200,
            maxRssMb: 310.4,
            width: 4032,
            height: 3024,
            outputBytes: 812_345,
          },
        },
        {
          caseId: 'iphone-01',
          pipeline: 'sharp-native',
          result: { ok: false, durationMs: 5, maxRssMb: 90, error: 'bad seek' },
        },
      ],
    });

    expect(report).toContain('Node v22.12.0 · darwin arm64 · Apple M2 · 16 GB RAM');
    expect(report).toContain('| heic-convert | 1/1 | 4.2 s | 4.2 s | 310 MB | ✅ Đạt |');
    expect(report).toContain('| sharp-native | 0/1 | — | — | 90 MB | ❌ Không đạt |');
    expect(report).toContain('| iphone-01 | heic-convert | 4032×3024 | 4.2 s | 310 MB | 793 KB |');
    expect(report).toContain('| iphone-01 | sharp-native | — | lỗi: bad seek | 90 MB | — |');
  });

  it('gộp lỗi nhiều dòng thành một ô bảng và thoát ký tự `|`', () => {
    const report = renderSpikeReport({
      generatedAt: '2026-10-05T08:00:00.000Z',
      environment,
      summaries: [],
      measurements: [
        {
          caseId: 'iphone-01',
          pipeline: 'sharp-native',
          result: { ok: false, durationMs: 5, maxRssMb: 90, error: 'bad seek\nheif: no HEVC | libde265\n' },
        },
      ],
    });

    expect(report).toContain('| lỗi: bad seek / heif: no HEVC \\| libde265 |');
  });
});
