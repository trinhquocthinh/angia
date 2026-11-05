import { describe, expect, it } from 'vitest';
import type { JobRow } from './readJobRows.js';
import { toOcrLatencySamples } from './toOcrLatencySamples.js';

const at = (seconds: number) => new Date(Date.UTC(2026, 9, 29, 10, 0, seconds));
const extractRow = (overrides: Partial<JobRow>): JobRow => ({
  name: 'extract-document',
  documentId: 'doc-1',
  state: 'completed',
  retryCount: 0,
  createdOn: at(3),
  startedOn: at(4),
  completedOn: at(12),
  output: { status: 'pending_review', costUsd: 0.001 },
  ...overrides,
});
const sanitizeRow = (overrides: Partial<JobRow> = {}): JobRow =>
  extractRow({
    name: 'sanitize-document-image',
    createdOn: at(0),
    startedOn: at(1),
    completedOn: at(3),
    output: null,
    ...overrides,
  });

describe('toOcrLatencySamples', () => {
  it('TC-439 đo từ lúc tạo job làm sạch tới lúc OCR hoàn tất, giữ thời gian chờ riêng của OCR', () => {
    const [sample] = toOcrLatencySamples([extractRow({}), sanitizeRow()]).extraction;
    expect(sample).toEqual({
      documentId: 'doc-1',
      outcome: 'pending_review',
      retryCount: 0,
      queueWaitMs: 1000,
      durationMs: 12000,
    });
  });

  it('TC-095 mỗi chứng từ chỉ lấy job đầu tiên — job xếp lại do ngân sách không tính lại từ đầu', () => {
    const samples = toOcrLatencySamples([
      sanitizeRow(),
      extractRow({ createdOn: at(30), completedOn: at(35), output: { status: 'pending_review' } }),
      extractRow({ completedOn: at(5), output: { status: 'awaiting_budget' } }),
    ]).extraction;
    expect(samples).toHaveLength(1);
    expect(samples[0]?.outcome).toBe('awaiting_budget');
    expect(samples[0]?.durationMs).toBe(5000);
  });

  it('TC-095 job thất bại ghi outcome failed; job chưa lưu output (trước bản vá worker) là unknown', () => {
    const samples = toOcrLatencySamples([
      sanitizeRow(),
      sanitizeRow({ documentId: 'doc-2' }),
      extractRow({ documentId: 'doc-1', state: 'failed', output: { message: 'boom' } }),
      extractRow({ documentId: 'doc-2', output: null }),
    ]).extraction;
    expect(samples.map((sample) => sample.outcome)).toEqual(['failed', 'unknown']);
  });

  it('TC-095 bỏ job chưa xong hoặc thiếu documentId', () => {
    const samples = toOcrLatencySamples([
      sanitizeRow(),
      extractRow({ completedOn: null }),
      extractRow({ documentId: null }),
    ]).extraction;
    expect(samples).toEqual([]);
  });

  it('TC-439 chứng từ tự nhập không vào mẫu NFR-3 nhưng vẫn có thời gian làm sạch', () => {
    const result = toOcrLatencySamples([
      sanitizeRow(),
      sanitizeRow({ documentId: 'doc-2', createdOn: at(1) }),
      sanitizeRow({ documentId: 'doc-3', completedOn: null }),
    ]);
    expect(result.extraction).toEqual([]);
    expect(result.sanitization).toEqual([3000, 2000]);
  });

  it('TC-439 bỏ OCR thiếu job làm sạch, không thay bằng mốc tạo OCR', () => {
    const result = toOcrLatencySamples([sanitizeRow({ documentId: 'doc-2' }), extractRow({})]);
    expect(result.extraction).toEqual([]);
  });
});
