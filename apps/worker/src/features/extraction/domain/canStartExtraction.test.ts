import { describe, expect, it } from 'vitest';
import { canStartExtraction } from './canStartExtraction.js';

describe('Điều kiện bắt đầu trích xuất (FSM BR §3.1)', () => {
  it('TC-161: chỉ extracting sau duyệt riêng tư được vào cổng OCR, gồm retry', () => {
    expect(canStartExtraction('uploaded')).toBe(false);
    expect(canStartExtraction('awaiting_privacy')).toBe(false);
    expect(canStartExtraction('extracting')).toBe(true);
  });

  it('chứng từ đã qua bước trích xuất không gọi AI lần nữa', () => {
    for (const status of [
      'pending_review',
      'manual_entry',
      'approved',
      'rejected',
      'awaiting_budget',
    ] as const) {
      expect(canStartExtraction(status)).toBe(false);
    }
  });
});
