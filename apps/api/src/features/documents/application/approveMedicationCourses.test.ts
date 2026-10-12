import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import type { ApproveRequest } from './approveDocument.js';
import { approveDocument } from './approveDocument.js';
import { createManualRecords } from './createManualRecords.js';
import type { ReviewRepository } from './reviewPorts.js';

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
        name: 'Amlodipin',
        strength: '5mg',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning'],
        durationDays: 30,
        longTerm: false,
        note: null,
        totalQuantity: 30,
      },
    ],
  },
});
const fixture = () => createMemoryReviewRepository([reviewDocument({ type: 'prescription' })]);

// Bỏ tạo đợt hoặc dùng ngày duyệt thay ngày kê phải làm các ca TC-043/045 thất bại.
describe('Khởi tạo đợt thuốc trong lệnh duyệt (SPEC-014)', () => {
  it('TC-043: Amlodipin 30 ngày tạo đúng đợt gắn dòng thuốc và hồ sơ', async () => {
    const memory = fixture();
    expect((await approveDocument(memory.repository, request())).ok).toBe(true);
    expect(memory.medicationCourses).toEqual([
      expect.objectContaining({
        healthProfileId: 'me',
        prescriptionItemId: memory.prescriptions[0]!.items[0]!.id,
        source: 'prescription',
        name: 'Amlodipin',
        nameNormalized: 'amlodipin',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning'],
        status: 'active',
        startDate: '2026-10-01',
        endDate: '2026-10-30',
      }),
    ]);
    expect(memory.documents[0]!.status).toBe('approved');
  });

  it('TC-044: thiếu thời lượng chặn toàn bộ đơn, kể cả dòng đầu hợp lệ', async () => {
    const memory = fixture();
    const draft = request();
    if (draft.type !== 'prescription') throw new Error('Sai loại fixture');
    draft.data.items.push({ ...draft.data.items[0]!, durationDays: null });
    expect(await approveDocument(memory.repository, draft)).toEqual({
      ok: false,
      code: 'ERR_DOSE_INFO_MISSING',
      invalidItemIndexes: [1],
    });
    expect(memory.prescriptions).toEqual([]);
    expect(memory.medicationCourses).toEqual([]);
    expect(memory.documents[0]!.status).toBe('pending_review');
  });

  it('TC-045: Metformin sáng + tối dài hạn có ngày kết thúc null', async () => {
    const memory = fixture();
    const draft = request();
    if (draft.type !== 'prescription') throw new Error('Sai loại fixture');
    Object.assign(draft.data.items[0]!, {
      name: 'Metformin',
      slots: ['morning', 'evening'],
      longTerm: true,
      durationDays: null,
    });
    await approveDocument(memory.repository, draft);
    expect(memory.medicationCourses).toEqual([
      expect.objectContaining({
        name: 'Metformin',
        slots: ['morning', 'evening'],
        status: 'active',
        startDate: '2026-10-01',
        endDate: null,
      }),
    ]);
  });

  it('nhập đơn trực tiếp vẫn tạo đợt từ đơn có cờ manual_without_source', async () => {
    const memory = createMemoryReviewRepository([]);
    const result = await createManualRecords(memory.repository, { ...request(), profileId: 'me' });
    expect(result.ok).toBe(true);
    expect(memory.prescriptions[0]).toMatchObject({ sourceDocumentId: null, manualWithoutSource: true });
    expect(memory.medicationCourses).toEqual([
      expect.objectContaining({
        source: 'prescription',
        endDate: '2026-10-30',
        prescriptionItemId: memory.prescriptions[0]!.items[0]!.id,
      }),
    ]);
  });

  it('lỗi ghi đợt rollback đơn và giữ chứng từ pending_review', async () => {
    const memory = fixture();
    const repository: ReviewRepository = {
      withFamily: (familyId, work) =>
        memory.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            insertMedicationCourses: async () => {
              throw new Error('Lỗi ghi đợt');
            },
          }),
        ),
    };
    await expect(approveDocument(repository, request())).rejects.toThrow('Lỗi ghi đợt');
    expect(memory.prescriptions).toEqual([]);
    expect(memory.medicationCourses).toEqual([]);
    expect(memory.documents[0]!.status).toBe('pending_review');
  });
});
