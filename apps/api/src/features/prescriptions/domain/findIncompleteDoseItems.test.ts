import { describe, expect, it } from 'vitest';
import { findIncompleteDoseItems, type DoseInfo } from './findIncompleteDoseItems.js';

const complete: DoseInfo = { quantityPerDose: 1, slots: ['morning'], durationDays: 30, longTerm: false };

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
});
