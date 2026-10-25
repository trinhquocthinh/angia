import { describe, expect, it } from 'vitest';
import { resolveSelfReportedConflict } from './resolveSelfReportedConflict';
import type { CourseConflict, CreateSelfReportedCourseRequest } from '@angia/contracts';

const request: CreateSelfReportedCourseRequest = {
  name: 'Canxi',
  strength: '500mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
};
const course = {
  id: 'old-1',
  name: 'CANXI',
  strength: '250mg',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['evening'] as const,
  startDate: '2026-09-01',
  endDate: null,
};
const conflicts: CourseConflict[] = [
  {
    itemIndexes: [0],
    nameNormalized: 'canxi',
    courses: [
      { ...course, slots: [...course.slots] },
      { ...course, id: 'old-2', slots: [...course.slots] },
    ],
  },
];
describe('Xác nhận xung đột thuốc bổ', () => {
  it('TC-049: chưa chọn không thể lưu', () => {
    expect(resolveSelfReportedConflict(request, conflicts, {})).toBeNull();
  });
  it.each(['replace', 'parallel'] as const)('TC-049: %s gửi đủ ID, giữ đúng bản khai báo', (resolution) => {
    expect(resolveSelfReportedConflict(request, conflicts, { canxi: resolution })).toEqual({
      ...request,
      resolution,
      expectedConflictCourseIds: ['old-1', 'old-2'],
    });
    expect(request).not.toHaveProperty('resolution');
  });
});
