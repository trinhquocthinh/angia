import { describe, expect, it } from 'vitest';
import { findIncompleteDoseItems, type DoseInfo } from './findIncompleteDoseItems.js';

const complete: DoseInfo = {
  quantityPerDose: 1,
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  externalUse: false,
};

describe('findIncompleteDoseItems — BR-025 chặn dòng thiếu liều/buổi/số ngày', () => {
  it('đơn đủ thông tin không có dòng lỗi; dòng dài hạn không cần số ngày', () => {
    const longTerm = { ...complete, durationDays: null, longTerm: true };
    expect(findIncompleteDoseItems([complete, longTerm])).toEqual([]);
  });

  it('SPEC-014: dòng 2 có durationDays null và longTerm false → chỉ rõ chỉ số 1', () => {
    expect(findIncompleteDoseItems([complete, { ...complete, durationDays: null }])).toEqual([1]);
  });

  it('thiếu liều mỗi lần hoặc không chọn buổi nào đều bị chặn, giữ thứ tự dòng', () => {
    const items = [{ ...complete, slots: [] }, complete, { ...complete, quantityPerDose: null }];
    expect(findIncompleteDoseItems(items)).toEqual([0, 2]);
  });

  it('TC-241: dòng thuốc dùng ngoài để trống liều mỗi lần vẫn hợp lệ', () => {
    expect(findIncompleteDoseItems([{ ...complete, quantityPerDose: null, externalUse: true }])).toEqual([]);
  });

  it('TC-242: dòng dùng ngoài vẫn bắt buộc buổi và số ngày; liều có nhập phải > 0', () => {
    const external = { ...complete, quantityPerDose: null, externalUse: true };
    const items = [
      { ...external, slots: [] },
      { ...external, durationDays: null },
      { ...external, quantityPerDose: 0 },
      { ...complete, quantityPerDose: null },
    ];
    expect(findIncompleteDoseItems(items)).toEqual([0, 1, 2, 3]);
  });

  it('TC-247: dòng "Khi cần" để trống liều vẫn hợp lệ; vẫn bắt buộc số ngày khi không dài hạn', () => {
    const asNeeded = { ...complete, slots: ['as_needed' as const], quantityPerDose: null };
    expect(findIncompleteDoseItems([asNeeded])).toEqual([]);
    expect(findIncompleteDoseItems([{ ...asNeeded, durationDays: null }])).toEqual([0]);
  });
});
