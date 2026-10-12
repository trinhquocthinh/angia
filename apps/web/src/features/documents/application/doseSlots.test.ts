import { describe, expect, it } from 'vitest';
import { doseSlotLabel, sortDoseSlots, toggleDoseSlot } from './doseSlots';

describe('Chọn buổi dùng, gồm "Khi cần" (BR-025 2026-10-12)', () => {
  it('TC-249: chọn "Khi cần" bỏ các buổi trong ngày; chọn lại một buổi thì bỏ "Khi cần"', () => {
    expect(toggleDoseSlot(['morning', 'evening'], 'as_needed')).toEqual(['as_needed']);
    expect(toggleDoseSlot(['as_needed'], 'noon')).toEqual(['noon']);
    expect(toggleDoseSlot(['as_needed'], 'as_needed')).toEqual([]);
  });

  it('buổi trong ngày bật/tắt và luôn theo thứ tự Sáng → Tối', () => {
    expect(toggleDoseSlot(['evening'], 'morning')).toEqual(['morning', 'evening']);
    expect(toggleDoseSlot(['morning', 'evening'], 'morning')).toEqual(['evening']);
    expect(sortDoseSlots(['evening', 'noon'])).toEqual(['noon', 'evening']);
  });

  it('nhãn hiển thị cho mọi buổi', () => {
    expect(['morning', 'as_needed'].map((slot) => doseSlotLabel(slot as 'morning'))).toEqual([
      'Sáng',
      'Khi cần',
    ]);
  });
});
