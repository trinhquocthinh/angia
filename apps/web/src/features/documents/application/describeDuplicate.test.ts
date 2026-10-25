import { describe, expect, it } from 'vitest';
import { describeDuplicate } from './describeDuplicate';

const saved = {
  duplicateOf: 'doc-1',
  recordDate: '2026-10-01',
  facility: 'BV Nhân dân Gia Định',
  savedAt: '2026-10-01T18:30:00.000Z',
};

describe('Mô tả bản đã lưu bị trùng (SPEC-012, Design §6)', () => {
  it('đơn thuốc: loại + ngày chứng từ + nơi khám + ngày lưu theo giờ Việt Nam', () => {
    expect(describeDuplicate(saved, 'prescription')).toBe(
      'đơn thuốc ngày 01/10/2026, BV Nhân dân Gia Định, lưu hôm 02/10/2026',
    );
  });

  it('bản nhập trực tiếp không nơi khám → ghi rõ nhập tay', () => {
    const manual = { ...saved, duplicateOf: null, facility: null };
    expect(describeDuplicate(manual, 'device_reading')).toBe(
      'số đo ngày 01/10/2026, nhập tay, lưu hôm 02/10/2026',
    );
    expect(describeDuplicate(manual, 'lab_result')).toContain('phiếu xét nghiệm ngày 01/10/2026');
  });
});
