import { describe, expect, it } from 'vitest';
import type { JobRow } from './readJobRows.js';
import { toOcrLatencySamples } from './toOcrLatencySamples.js';

const at = (seconds: number) => new Date(Date.UTC(2026, 9, 18, 8, 0, seconds));
const extractRow = (overrides: Partial<JobRow>): JobRow => ({
  name: 'extract-document',
  documentId: 'doc-1',
  state: 'completed',
  retryCount: 0,
  createdOn: at(0),
  startedOn: at(1),
  completedOn: at(9),
  output: { status: 'pending_review', costUsd: 0.001 },
  ...overrides,
});

describe('toOcrLatencySamples', () => {
  it('TC-095 đo từ lúc duyệt (tạo job) tới lúc job hoàn tất, kèm thời gian chờ hàng đợi', () => {
    const [sample] = toOcrLatencySamples([extractRow({})]).extraction;
    expect(sample).toEqual({
      documentId: 'doc-1',
      outcome: 'pending_review',
      retryCount: 0,
      queueWaitMs: 1000,
      durationMs: 9000,
    });
  });

  it('TC-095 mỗi chứng từ chỉ lấy job đầu tiên — job xếp lại do ngân sách không tính lại từ đầu', () => {
    const samples = toOcrLatencySamples([
      extractRow({ createdOn: at(30), completedOn: at(35), output: { status: 'pending_review' } }),
      extractRow({ createdOn: at(0), completedOn: at(1), output: { status: 'awaiting_budget' } }),
    ]).extraction;
    expect(samples).toHaveLength(1);
    expect(samples[0]?.outcome).toBe('awaiting_budget');
  });

  it('TC-095 job thất bại ghi outcome failed; job chưa lưu output (trước bản vá worker) là unknown', () => {
    const samples = toOcrLatencySamples([
      extractRow({ documentId: 'doc-1', state: 'failed', output: { message: 'boom' } }),
      extractRow({ documentId: 'doc-2', output: null }),
    ]).extraction;
    expect(samples.map((sample) => sample.outcome)).toEqual(['failed', 'unknown']);
  });

  it('TC-095 bỏ job chưa xong hoặc thiếu documentId', () => {
    const samples = toOcrLatencySamples([
      extractRow({ completedOn: null }),
      extractRow({ documentId: null }),
    ]).extraction;
    expect(samples).toEqual([]);
  });

  it('TC-095 job chuẩn bị ảnh OCR tách riêng, tính mọi lần (mỗi bản nháp riêng tư một job)', () => {
    const prepare = extractRow({ name: 'prepare-ocr-image', output: null, completedOn: at(3) });
    const result = toOcrLatencySamples([prepare, { ...prepare, createdOn: at(1) }]);
    expect(result.extraction).toEqual([]);
    expect(result.preparation).toEqual([3000, 2000]);
  });
});
