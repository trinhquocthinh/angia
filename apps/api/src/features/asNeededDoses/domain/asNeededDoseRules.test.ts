import { describe, expect, it } from 'vitest';
import type { AsNeededCourse } from './AsNeededDose.js';
import { canRecordAsNeededDose } from './canRecordAsNeededDose.js';
import { resolveDoseInterval } from './resolveDoseInterval.js';

const course: AsNeededCourse = {
  id: 'course-1',
  prescriptionItemId: 'item-1',
  slots: ['as_needed'],
  startDate: '2026-11-01',
  endDate: '2026-11-05',
  minIntervalText: null,
  userIntervalText: null,
};

describe('Quy tắc liều "Khi cần" (BR-054)', () => {
  it('TC-495: đợt "Khi cần" từ đơn còn hiệu lực ngày cho thuốc thì ghi được, kể cả hai đầu', () => {
    for (const date of ['2026-11-01', '2026-11-03', '2026-11-05'])
      expect(canRecordAsNeededDose(course, date)).toBe(true);
    expect(canRecordAsNeededDose({ ...course, endDate: null }, '2027-01-01')).toBe(true);
  });
  it('TC-497: đợt 4 buổi, đợt tự khai, ngoài hiệu lực hoặc không tìm thấy đều bị chặn', () => {
    expect(
      canRecordAsNeededDose({ ...course, slots: ['morning', 'noon', 'afternoon', 'evening'] }, '2026-11-03'),
    ).toBe(false);
    expect(canRecordAsNeededDose({ ...course, prescriptionItemId: null }, '2026-11-03')).toBe(false);
    expect(canRecordAsNeededDose(course, '2026-10-31')).toBe(false);
    expect(canRecordAsNeededDose(course, '2026-11-06')).toBe(false);
    expect(canRecordAsNeededDose(null, '2026-11-03')).toBe(false);
  });
  it('TC-496: ưu tiên khoảng cách trên đơn, rồi người dùng nhập, không có thì null', () => {
    expect(resolveDoseInterval(null, null)).toBeNull();
    expect(resolveDoseInterval(null, 'cách 6 giờ')).toEqual({ text: 'cách 6 giờ', source: 'user' });
    expect(resolveDoseInterval('cách 4–6 giờ', 'cách 6 giờ')).toEqual({
      text: 'cách 4–6 giờ',
      source: 'prescription',
    });
  });
});
