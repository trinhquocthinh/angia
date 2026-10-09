import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import type { PrescriptionDraft } from './approvalDrafts.js';
import { approveDocument } from './approveDocument.js';

const item = {
  name: 'Amlodipin',
  strength: '5mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning' as const],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: 30,
};
const prescription = (data: Partial<PrescriptionDraft> = {}) => ({
  familyId: 'family-a',
  documentId: 'doc-1',
  type: 'prescription' as const,
  data: {
    type: 'prescription' as const,
    issuedDate: '2026-10-01',
    facility: 'BV Tỉnh',
    diagnosis: 'Tăng huyết áp (I10)',
    items: [item, { ...item, name: 'Metformin', strength: '500mg', durationDays: null, longTerm: true }],
    ...data,
  },
});
const pendingPrescription = () => createMemoryReviewRepository([reviewDocument({ type: 'prescription' })]);

describe('Phê duyệt đơn thuốc (SPEC-010, BR-025, BR-042)', () => {
  it('lưu đơn + dòng thuốc theo thứ tự, tên chuẩn hóa, dài hạn không có số ngày; chứng từ approved', async () => {
    const memory = pendingPrescription();
    const result = await approveDocument(memory.repository, prescription());
    expect(result.ok).toBe(true);
    expect(memory.prescriptions).toEqual([
      expect.objectContaining({
        healthProfileId: 'me',
        sourceDocumentId: 'doc-1',
        issuedDate: '2026-10-01',
        diagnosis: 'Tăng huyết áp (I10)',
        manualWithoutSource: false,
        items: [
          expect.objectContaining({ name: 'Amlodipin', durationDays: 30, totalQuantity: 30 }),
          expect.objectContaining({ name: 'Metformin', durationDays: null, longTerm: true }),
        ],
      }),
    ]);
    expect(memory.documents[0]).toMatchObject({ status: 'approved', documentDate: '2026-10-01' });
  });

  it('TC-031: đơn thuốc thiếu ngày kê → ERR_DOCUMENT_DATE_REQUIRED, vẫn pending_review', async () => {
    const memory = pendingPrescription();
    expect(await approveDocument(memory.repository, prescription({ issuedDate: null }))).toEqual({
      ok: false,
      code: 'ERR_DOCUMENT_DATE_REQUIRED',
    });
    expect(memory.documents[0]!.status).toBe('pending_review');
    expect(memory.prescriptions).toEqual([]);
  });

  it('BR-025: dòng 2 thiếu buổi và số ngày → ERR_DOSE_INFO_MISSING chỉ rõ dòng, không lưu dòng nào', async () => {
    const memory = pendingPrescription();
    const items = [item, { ...item, slots: [], durationDays: null }];
    expect(await approveDocument(memory.repository, prescription({ items }))).toEqual({
      ok: false,
      code: 'ERR_DOSE_INFO_MISSING',
      invalidItemIndexes: [1],
    });
    expect(memory.prescriptions).toEqual([]);
    expect(memory.documents[0]!.status).toBe('pending_review');
  });

  it('BR-025: API không tự tính số ngày từ tổng số lượng', async () => {
    const memory = pendingPrescription();
    const items = [{ ...item, durationDays: null, totalQuantity: 30 }];
    expect(await approveDocument(memory.repository, prescription({ items }))).toMatchObject({
      code: 'ERR_DOSE_INFO_MISSING',
      invalidItemIndexes: [0],
    });
  });

  it('lệnh duyệt đơn thuốc cho chứng từ xét nghiệm → ERR_VALIDATION', async () => {
    const memory = createMemoryReviewRepository([reviewDocument({ type: 'lab_result' })]);
    expect(await approveDocument(memory.repository, prescription())).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
});

describe('Phê duyệt phiếu xét nghiệm (SPEC-010, BR-022)', () => {
  const lab = (resultDate: string | null) => ({
    familyId: 'family-a',
    documentId: 'doc-1',
    type: 'lab_result' as const,
    data: {
      type: 'lab_result' as const,
      resultDate,
      facility: 'TTYT',
      items: [
        { testName: 'HbA1c', value: '7.2', unit: '%', referenceRange: '4.0 - 6.0' },
        { testName: 'Glucose', value: '6,8', unit: null, referenceRange: null },
      ],
    },
  });

  it('lưu mỗi chỉ số một dòng, giữ nguyên văn giá trị/đơn vị/khoảng tham chiếu', async () => {
    const memory = createMemoryReviewRepository([reviewDocument({ type: 'lab_result' })]);
    const result = await approveDocument(memory.repository, lab('2026-10-01'));
    expect(result.ok && result.value.labResults).toHaveLength(2);
    expect(memory.labResults).toEqual([
      expect.objectContaining({
        sourceDocumentId: 'doc-1',
        resultDate: '2026-10-01',
        testName: 'HbA1c',
        value: '7.2',
        referenceRange: '4.0 - 6.0',
        facility: 'TTYT',
      }),
      expect.objectContaining({ testName: 'Glucose', value: '6,8', unit: null, referenceRange: null }),
    ]);
    expect(memory.documents[0]).toMatchObject({ status: 'approved', documentDate: '2026-10-01' });
  });

  it('thiếu ngày trả kết quả → ERR_DOCUMENT_DATE_REQUIRED', async () => {
    const memory = createMemoryReviewRepository([reviewDocument({ type: 'lab_result' })]);
    expect(await approveDocument(memory.repository, lab(null))).toEqual({
      ok: false,
      code: 'ERR_DOCUMENT_DATE_REQUIRED',
    });
    expect(memory.labResults).toEqual([]);
  });
});
