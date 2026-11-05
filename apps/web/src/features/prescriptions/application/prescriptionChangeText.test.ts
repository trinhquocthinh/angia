import { describe, expect, it } from 'vitest';
import { prescriptionChangeText } from './prescriptionChangeText';

describe('TC-482 — diễn đạt trường thay đổi đúng dữ liệu API', () => {
  it('giữ null, số thập phân, tập buổi và boolean', () => {
    expect(prescriptionChangeText({ field: 'quantityPerDose', before: null, after: 0.5 })).toEqual({
      label: 'Liều mỗi lần',
      before: 'Không ghi',
      after: '0,5',
    });
    expect(prescriptionChangeText({ field: 'slots', before: [], after: ['as_needed'] })).toEqual({
      label: 'Buổi',
      before: 'Không ghi',
      after: 'Khi cần',
    });
    expect(prescriptionChangeText({ field: 'externalUse', before: false, after: true })).toEqual({
      label: 'Dùng ngoài',
      before: 'Không',
      after: 'Có',
    });
  });
});
