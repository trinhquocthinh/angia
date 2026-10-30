import { describe, expect, it } from 'vitest';
import { ReviewRequestError } from '@src/features/documents/application/ReviewRequestError';
import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import { courseConflictPrompt } from './courseConflictPrompt';
import { resolveCoursePrompt } from './resolveCoursePrompt';

export const request: ApproveDocumentRequest = {
  type: 'prescription',
  confirmDuplicate: true,
  data: {
    type: 'prescription',
    issuedDate: '2026-10-01',
    revisitDate: null,
    facility: null,
    diagnosis: null,
    items: ['5mg', '10mg'].map((strength) => ({
      name: 'Amlodipin',
      strength,
      quantityPerDose: 1,
      externalUse: false,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    })),
  },
};
export const conflicts = [
  {
    itemIndexes: [0, 1],
    nameNormalized: 'amlodipin',
    courses: [
      {
        id: '01900000-0000-7000-8000-000000000001',
        name: 'Amlodipin',
        strength: '5mg',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning' as const],
        startDate: '2026-09-01',
        endDate: null,
      },
    ],
  },
];
const error = () =>
  new ReviewRequestError(
    'Chọn xử lý',
    409,
    'ERR_COURSE_CONFLICT_UNRESOLVED',
    [],
    [],
    null,
    structuredClone(conflicts),
  );

describe('Lựa chọn xung đột gắn với bản đối soát đã gửi', () => {
  it('TC-046: chuyển lỗi xung đột thành câu hỏi rõ từng dòng', () => {
    expect(courseConflictPrompt(error(), request)).toMatchObject({
      formError: null,
      prompt: { request, conflicts },
    });
  });
  it('không dùng chi tiết lỗi cho lệnh khác loại hoặc chỉ số dòng vượt giới hạn', () => {
    expect(courseConflictPrompt(error(), null).prompt).toBeNull();
    const bad = error();
    bad.courseConflicts[0]!.itemIndexes = [99];
    expect(courseConflictPrompt(bad, request).prompt).toBeNull();
  });
  it('TC-047: lựa chọn chung cho mọi dòng cùng tên, giữ xác nhận trùng chứng từ và không sửa đầu vào', () => {
    const prompt = { request: structuredClone(request), conflicts };
    const before = structuredClone(prompt);
    const result = resolveCoursePrompt(prompt, { amlodipin: 'replace' });
    expect(result).toMatchObject({
      confirmDuplicate: true,
      data: {
        items: [
          {
            strength: '5mg',
            resolution: 'replace',
            expectedConflictCourseIds: [conflicts[0]!.courses[0]!.id],
          },
          {
            strength: '10mg',
            resolution: 'replace',
            expectedConflictCourseIds: [conflicts[0]!.courses[0]!.id],
          },
        ],
      },
    });
    expect(prompt).toEqual(before);
  });
  it('TC-048: chưa đủ lựa chọn thì chưa tạo lệnh gửi; song song được gửi tường minh', () => {
    const prompt = { request, conflicts };
    expect(resolveCoursePrompt(prompt, {})).toBeNull();
    expect(resolveCoursePrompt(prompt, { amlodipin: 'parallel' })).toMatchObject({
      data: { items: [{ resolution: 'parallel' }, { resolution: 'parallel' }] },
    });
  });
});
