import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import type { MedicationCourse } from '@src/features/medications/domain/MedicationCourse.js';
import { approveDocument } from './approveDocument.js';
import { createManualRecords } from './createManualRecords.js';
import type { ApproveRequest } from './approveDocument.js';
import type { ReviewRepository } from './reviewPorts.js';

const course = (id = 'old-1'): MedicationCourse => ({
  id,
  healthProfileId: 'me',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Amlodipin',
  nameNormalized: 'amlodipin',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-09-01',
  endDate: null,
  status: 'active',
});
const request = (): ApproveRequest => ({
  familyId: 'family-a',
  documentId: 'doc-1',
  type: 'prescription',
  data: {
    type: 'prescription',
    issuedDate: '2026-10-01',
    facility: null,
    diagnosis: null,
    items: [
      {
        name: 'AMLODIPIN',
        strength: '10mg',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['evening'],
        durationDays: 30,
        longTerm: false,
        note: null,
        totalQuantity: null,
      },
    ],
  },
});
function fixture(old: MedicationCourse[] = [course()]) {
  const memory = createMemoryReviewRepository([reviewDocument({ type: 'prescription' })]);
  memory.medicationCourses.push(...old);
  return memory;
}
const resolve = (resolution: 'replace' | 'parallel', ids = ['old-1']) => {
  const draft = request();
  if (draft.type !== 'prescription') throw new Error('Sai fixture');
  Object.assign(draft.data.items[0]!, { resolution, expectedConflictCourseIds: ids });
  return draft;
};

describe('Giải quyết xung đột thuốc khi lưu đơn (SPEC-015)', () => {
  it('TC-046: chưa chọn thì không lưu đơn, không đổi đợt cũ hoặc trạng thái chứng từ', async () => {
    const m = fixture();
    expect(await approveDocument(m.repository, request())).toMatchObject({
      ok: false,
      code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
      conflicts: [{ itemIndexes: [0], nameNormalized: 'amlodipin', courses: [{ id: 'old-1' }] }],
    });
    expect(m.prescriptions).toEqual([]);
    expect(m.medicationCourses).toEqual([course()]);
    expect(m.documents[0]!.status).toBe('pending_review');
  });
  it('TC-047: thay tất cả đợt xung đột và tạo một đợt mới', async () => {
    const m = fixture([course(), course('old-2')]);
    expect((await approveDocument(m.repository, resolve('replace', ['old-2', 'old-1']))).ok).toBe(true);
    expect(m.medicationCourses.slice(0, 2)).toEqual([
      { ...course(), status: 'replaced', endDate: '2026-09-30' },
      { ...course('old-2'), status: 'replaced', endDate: '2026-09-30' },
    ]);
    expect(m.medicationCourses[2]).toMatchObject({
      status: 'active',
      startDate: '2026-10-01',
      endDate: '2026-10-30',
    });
  });
  it('TC-048: song song giữ nguyên đợt cũ', async () => {
    const m = fixture();
    expect((await approveDocument(m.repository, resolve('parallel'))).ok).toBe(true);
    expect(m.medicationCourses[0]).toEqual(course());
    expect(m.medicationCourses).toHaveLength(2);
  });
  it('thay thế cùng ngày tạo khoảng rỗng và không xóa bản cũ', async () => {
    const m = fixture([{ ...course(), startDate: '2026-10-01' }]);
    await approveDocument(m.repository, resolve('replace'));
    expect(m.medicationCourses[0]).toMatchObject({
      status: 'replaced',
      startDate: '2026-10-01',
      endDate: '2026-09-30',
    });
    expect(m.medicationCourses).toHaveLength(2);
  });
  it('danh sách xung đột đổi thì phải xác nhận lại, không tự đóng đợt mới xuất hiện', async () => {
    const m = fixture([course(), course('old-2')]);
    expect(await approveDocument(m.repository, resolve('replace'))).toMatchObject({
      ok: false,
      code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
    });
    expect(m.medicationCourses.every((c) => c.status === 'active')).toBe(true);
    expect(m.prescriptions).toEqual([]);
  });
  it('nhập trực tiếp dùng cùng quy tắc xung đột', async () => {
    const m = fixture();
    expect(await createManualRecords(m.repository, { ...request(), profileId: 'me' })).toMatchObject({
      code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
    });
    expect((await createManualRecords(m.repository, { ...resolve('replace'), profileId: 'me' })).ok).toBe(
      true,
    );
    expect(m.medicationCourses[0]!.status).toBe('replaced');
  });
  it('lỗi ghi đợt rollback cả thay thế đợt cũ và đơn mới', async () => {
    const m = fixture();
    const repository: ReviewRepository = {
      withFamily: (familyId, work) =>
        m.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            insertMedicationCourses: async () => {
              throw new Error('Lỗi ghi đợt mới');
            },
          }),
        ),
    };
    await expect(approveDocument(repository, resolve('replace'))).rejects.toThrow('Lỗi ghi đợt mới');
    expect(m.medicationCourses).toEqual([course()]);
    expect(m.prescriptions).toEqual([]);
    expect(m.documents[0]!.status).toBe('pending_review');
  });
  it('giữ hai dòng cùng tên thành hai đợt riêng, thay đợt cũ đúng một lần', async () => {
    const m = fixture();
    const draft = resolve('replace');
    if (draft.type !== 'prescription') throw new Error('Sai fixture');
    draft.data.items.push({ ...draft.data.items[0]!, strength: '5mg' });
    expect((await approveDocument(m.repository, draft)).ok).toBe(true);
    expect(m.medicationCourses).toHaveLength(3);
    expect(m.medicationCourses.filter((c) => c.status === 'active')).toHaveLength(2);
    expect(m.prescriptions[0]!.items.map((i) => i.strength)).toEqual(['10mg', '5mg']);
    expect(m.medicationCourses[1]!.prescriptionItemId).not.toBe(m.medicationCourses[2]!.prescriptionItemId);
  });
});
