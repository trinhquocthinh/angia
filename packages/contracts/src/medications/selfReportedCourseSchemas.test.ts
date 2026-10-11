import { describe, expect, it } from 'vitest';
import { createSelfReportedCourseRequestSchema } from './selfReportedCourseSchemas.js';
const draft = {
  name: 'Canxi',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
};
describe('Hợp đồng khai báo thuốc bổ', () => {
  it('TC-049: chuẩn hóa khoảng trắng và giữ liều thập phân', () => {
    expect(createSelfReportedCourseRequestSchema.parse({ ...draft, name: ' Canxi ' }).name).toBe('Canxi');
  });
  it('TC-050: cho phép thiếu buổi/liều tới Application để trả lỗi nghiệp vụ', () => {
    expect(
      createSelfReportedCourseRequestSchema.safeParse({ ...draft, slots: [], quantityPerDose: null }).success,
    ).toBe(true);
    const missing = { name: 'Canxi', doseUnit: 'viên', startDate: '2026-10-01' };
    expect(createSelfReportedCourseRequestSchema.safeParse(missing).success).toBe(true);
  });
  it.each([
    { quantityPerDose: 0 },
    { startDate: '2026-02-30' },
    { doseUnit: ' ' },
    { slots: ['morning', 'morning'] },
    { expectedConflictCourseIds: ['không-phải-uuid'] },
    { source: 'prescription' },
    { endDate: '2026-10-31' },
  ])('TC-049: chặn lệnh sai hoặc ghi đè nguồn/thời hạn: %j', (invalid) => {
    expect(createSelfReportedCourseRequestSchema.safeParse({ ...draft, ...invalid }).success).toBe(false);
  });
});
