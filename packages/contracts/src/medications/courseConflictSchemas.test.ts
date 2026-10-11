import { describe, expect, it } from 'vitest';
import { approveDocumentRequestSchema } from '../documents/reviewSchemas.js';
import { courseConflictErrorResponseSchema } from './courseConflictSchemas.js';

const id = '01900000-0000-7000-8000-000000000001';
const request = {
  type: 'prescription',
  data: {
    type: 'prescription',
    issuedDate: '2026-10-01',
    facility: null,
    diagnosis: null,
    items: [
      {
        name: 'A',
        strength: null,
        quantityPerDose: 1,
        doseUnit: null,
        slots: ['morning'],
        durationDays: 30,
        longTerm: false,
        note: null,
        totalQuantity: null,
        resolution: 'replace',
        expectedConflictCourseIds: [id],
      },
    ],
  },
};
describe('Hợp đồng lựa chọn xung đột thuốc', () => {
  it('TC-047: giữ lựa chọn và danh sách ID qua parse, không để Zod bỏ trường', () => {
    expect(approveDocumentRequestSchema.parse(request)).toEqual(request);
  });
  it('từ chối lựa chọn ngoài danh sách và ID không hợp lệ/lặp', () => {
    for (const changes of [
      { resolution: 'ignore' },
      { expectedConflictCourseIds: ['bad'] },
      { expectedConflictCourseIds: [id, id] },
    ])
      expect(
        approveDocumentRequestSchema.safeParse({
          ...request,
          data: { ...request.data, items: [{ ...request.data.items[0], ...changes }] },
        }).success,
      ).toBe(false);
  });
  it('TC-046: phản hồi xung đột phải nêu đợt và chỉ số dòng hợp lệ', () => {
    expect(
      courseConflictErrorResponseSchema.safeParse({
        error: {
          code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
          message: 'Xung đột',
          details: { conflicts: [{ itemIndexes: [99], nameNormalized: 'a', courses: [] }] },
        },
      }).success,
    ).toBe(false);
  });
  it('TC-046: cho phép nhóm rỗng để xác nhận lại khi đợt cũ vừa biến mất', () => {
    expect(
      courseConflictErrorResponseSchema.safeParse({
        error: {
          code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
          message: 'Danh sách đã thay đổi',
          details: { conflicts: [{ itemIndexes: [0], nameNormalized: 'a', courses: [] }] },
        },
      }).success,
    ).toBe(true);
  });
});
