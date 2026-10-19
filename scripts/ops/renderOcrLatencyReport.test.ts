import { describe, expect, it } from 'vitest';
import { assessOcrLatency } from './assessOcrLatency.js';
import { renderOcrLatencyReport } from './renderOcrLatencyReport.js';
import { summarizeDurations } from './summarizeDurations.js';

const samples = Array.from({ length: 20 }, (_, index) => ({
  documentId: `019a0f8c-2a1e-7000-8000-${String(index).padStart(12, '0')}`,
  outcome: 'pending_review',
  retryCount: index === 0 ? 1 : 0,
  queueWaitMs: 1_200,
  durationMs: 6_000 + index * 100,
}));

const render = () =>
  renderOcrLatencyReport({
    generatedAt: '2026-10-19T08:00:00.000Z',
    since: '2026-10-18T00:00:00.000Z',
    verdict: assessOcrLatency(samples),
    preparation: summarizeDurations([800, 1_200]),
    samples,
  });

describe('renderOcrLatencyReport', () => {
  it('TC-095 ghi kết luận, trung vị theo giây và định nghĩa khoảng đo', () => {
    const report = render();
    expect(report).toContain('**ĐẠT**');
    expect(report).toContain('| Có bản trích xuất (pending_review) | 20 | 7.0 s |');
    expect(report).toContain('duyệt riêng tư');
    expect(report).toContain('| Chuẩn bị ảnh OCR (prepare-ocr-image) | 2 | 1.0 s |');
  });

  it('TC-095 bảng chi tiết chỉ hiện 8 ký tự cuối mã chứng từ (UUIDv7 trùng phần đầu), kèm số lần thử lại', () => {
    const report = render();
    expect(report).toContain('| 00000000 | pending_review | 1 | 1.2 s | 6.0 s |');
    expect(report).toContain('| 00000001 | pending_review | 0 |');
    expect(report).not.toContain('019a0f8c');
  });

  it('TC-095 không đạt thì liệt kê lý do', () => {
    const report = renderOcrLatencyReport({
      generatedAt: '2026-10-19T08:00:00.000Z',
      since: '2026-10-18T00:00:00.000Z',
      verdict: assessOcrLatency([]),
      preparation: summarizeDurations([]),
      samples: [],
    });
    expect(report).toContain('**KHÔNG ĐẠT**');
    expect(report).toContain('- Mới có 0/20 chứng từ có bản trích xuất');
    expect(report).toContain('| Chuẩn bị ảnh OCR (prepare-ocr-image) | 0 | — |');
  });
});
