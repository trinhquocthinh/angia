import { describe, expect, it } from 'vitest';
import { selfReportedCourseFormSchema, toSelfReportedCourseRequest } from './selfReportedCourseForm';
const form = {
  name: ' Canxi ',
  strength: ' 500mg ',
  quantityPerDose: '0,5',
  doseUnit: ' viên ',
  slots: ['morning'] as const,
  startDate: '2026-10-01',
};
describe('Form khai báo thuốc bổ', () => {
  it('TC-049: liều dùng dấu phẩy thành số; không gửi nguồn hoặc thời hạn', () => {
    expect(toSelfReportedCourseRequest({ ...form, slots: [...form.slots] })).toEqual({
      name: 'Canxi',
      strength: '500mg',
      quantityPerDose: 0.5,
      doseUnit: 'viên',
      slots: ['morning'],
      startDate: '2026-10-01',
    });
  });
  it.each([
    { quantityPerDose: '' },
    { slots: [] },
    { doseUnit: '' },
    { startDate: '2026-02-30' },
    { quantityPerDose: '0' },
  ])('TC-050: chặn ô không hợp lệ: %j', (invalid) => {
    expect(selfReportedCourseFormSchema.safeParse({ ...form, ...invalid }).success).toBe(false);
  });
});
