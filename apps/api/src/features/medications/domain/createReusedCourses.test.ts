import { describe, expect, it } from 'vitest';
import { reusablePrescription } from '@src/shared/test/reusablePrescription.js';
import { createReusedCourses } from './createReusedCourses.js';

describe('createReusedCourses — sinh đợt mới khi Dùng lại đơn (SPEC-029)', () => {
  it('TC-276: chép dòng gốc, tính ngày kết thúc từ ngày bắt đầu mới, giữ thứ tự dòng chọn', () => {
    const courses = createReusedCourses(
      reusablePrescription(),
      [
        { prescriptionItemId: 'item-2', durationDays: null, longTerm: true },
        { prescriptionItemId: 'item-1', durationDays: 30, longTerm: false },
        { prescriptionItemId: 'item-3', durationDays: 5, longTerm: false },
      ],
      '2026-10-13',
    );
    expect(courses).toEqual([
      {
        healthProfileId: 'profile-1',
        prescriptionItemId: 'item-2',
        source: 'prescription',
        name: 'Metformin',
        nameNormalized: 'metformin',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning', 'evening'],
        startDate: '2026-10-13',
        endDate: null,
        status: 'active',
      },
      expect.objectContaining({
        prescriptionItemId: 'item-1',
        startDate: '2026-10-13',
        endDate: '2026-11-11',
      }),
      expect.objectContaining({
        prescriptionItemId: 'item-3',
        quantityPerDose: null,
        slots: ['as_needed'],
        endDate: '2026-10-17',
      }),
    ]);
  });

  it('TC-276: tắt Dài hạn bằng số ngày thì dùng số ngày; bật Dài hạn thì bỏ qua số ngày', () => {
    const [shortened, longTerm] = createReusedCourses(
      reusablePrescription(),
      [
        { prescriptionItemId: 'item-2', durationDays: 10, longTerm: false },
        { prescriptionItemId: 'item-1', durationDays: 30, longTerm: true },
      ],
      '2026-10-13',
    );
    expect(shortened?.endDate).toBe('2026-10-22');
    expect(longTerm?.endDate).toBeNull();
  });
});
