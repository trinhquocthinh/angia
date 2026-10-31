import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import { approveDocument } from './approveDocument.js';
import { createManualRecords } from './createManualRecords.js';

const draft = (revisitDate: string | null) => ({
  type: 'prescription' as const,
  issuedDate: '2026-10-01',
  revisitDate,
  facility: null,
  diagnosis: null,
  items: [
    {
      name: 'Thuốc A',
      strength: null,
      quantityPerDose: 1,
      externalUse: false,
      doseUnit: 'viên',
      slots: ['morning' as const],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
  ],
});

describe('Ngày hẹn tái khám khi lưu đơn (SPEC-043)', () => {
  it.each(['2026-10-01', '2026-10-31', '2036-09-28', null])(
    'TC-573/472: duyệt giữ ngày hẹn %s, kể cả đơn cũ và hai biên',
    async (revisitDate) => {
      const memory = createMemoryReviewRepository([reviewDocument({ type: 'prescription' })]);
      const result = await approveDocument(memory.repository, {
        familyId: 'family-a',
        documentId: 'doc-1',
        type: 'prescription',
        data: draft(revisitDate),
      });
      expect(result.ok).toBe(true);
      expect(memory.prescriptions[0]).toMatchObject({ revisitDate });
    },
  );

  it.each(['2026-09-30', '2036-09-29', '2026-02-30', 'không phải ngày'])(
    'TC-472: ngày hẹn %s không hợp lệ không ghi đơn, đợt thuốc hoặc duyệt chứng từ',
    async (revisitDate) => {
      const memory = createMemoryReviewRepository([reviewDocument({ type: 'prescription' })]);
      const result = await approveDocument(memory.repository, {
        familyId: 'family-a',
        documentId: 'doc-1',
        type: 'prescription',
        data: draft(revisitDate),
      });
      expect(result).toEqual({ ok: false, code: 'ERR_VALIDATION' });
      expect(memory.prescriptions).toEqual([]);
      expect(memory.medicationCourses).toEqual([]);
      expect(memory.documents[0]?.status).toBe('pending_review');
    },
  );

  it('TC-573: nhập trực tiếp lưu ngày hẹn và nguồn nhập tay', async () => {
    const memory = createMemoryReviewRepository([]);
    expect(
      (
        await createManualRecords(memory.repository, {
          familyId: 'family-a',
          profileId: 'me',
          type: 'prescription',
          data: draft('2026-10-31'),
        })
      ).ok,
    ).toBe(true);
    expect(memory.prescriptions[0]).toMatchObject({
      revisitDate: '2026-10-31',
      sourceDocumentId: null,
      manualWithoutSource: true,
    });
  });

  it('TC-573: lệnh cũ thiếu trường ngày hẹn được lưu thành null', async () => {
    const memory = createMemoryReviewRepository([]);
    const data: Omit<ReturnType<typeof draft>, 'revisitDate'> & { revisitDate?: string | null } = draft(null);
    delete data.revisitDate;
    await createManualRecords(memory.repository, {
      familyId: 'family-a',
      profileId: 'me',
      type: 'prescription',
      data,
    });
    expect(memory.prescriptions[0]).toMatchObject({ revisitDate: null });
  });
});
