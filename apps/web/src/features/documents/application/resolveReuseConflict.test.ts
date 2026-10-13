import { describe, expect, it } from 'vitest';
import { resolveReuseConflict } from './resolveReuseConflict';

const request = {
  startDate: '2026-10-13',
  items: [
    { prescriptionItemId: 'a', durationDays: 30, longTerm: false },
    { prescriptionItemId: 'b', durationDays: null, longTerm: true },
  ],
};
const conflicts = [{ itemIndexes: [0], nameNormalized: 'amlodipin', courses: [{ id: 'old' }] }] as never;

describe('TC-284 gắn lựa chọn Thay thế/Song song vào lệnh Dùng lại', () => {
  it('chỉ trả lệnh khi mọi nhóm đã chọn; dòng thuộc nhóm nhận lựa chọn và đủ ID đợt cũ', () => {
    expect(resolveReuseConflict(request, conflicts, {})).toBeNull();
    expect(resolveReuseConflict(request, conflicts, { amlodipin: 'replace' })).toEqual({
      startDate: '2026-10-13',
      items: [
        {
          prescriptionItemId: 'a',
          durationDays: 30,
          longTerm: false,
          resolution: 'replace',
          expectedConflictCourseIds: ['old'],
        },
        { prescriptionItemId: 'b', durationDays: null, longTerm: true },
      ],
    });
  });
});
