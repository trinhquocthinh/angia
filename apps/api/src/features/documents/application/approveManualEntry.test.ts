import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
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
  totalQuantity: null,
};
const prescription = (issuedDate: string | null = '2026-10-01') => ({
  familyId: 'family-a',
  documentId: 'doc-1',
  type: 'prescription' as const,
  data: {
    type: 'prescription' as const,
    issuedDate,
    facility: null,
    diagnosis: null,
    items: [item, { ...item, name: 'Metformin', strength: '500mg' }],
  },
});
const manualDocument = (overrides = {}) =>
  createMemoryReviewRepository([reviewDocument({ status: 'manual_entry', type: null, ...overrides })]);

describe('Nhập tay theo ảnh chứng từ (SPEC-011, BR-014, BR-016)', () => {
  it('TC-036: chứng từ manual_entry, nhập đơn thuốc 2 dòng → đơn gắn chứng từ, chứng từ approved', async () => {
    const memory = manualDocument();
    const result = await approveDocument(memory.repository, prescription());
    expect(result.ok).toBe(true);
    expect(memory.prescriptions).toEqual([
      expect.objectContaining({
        sourceDocumentId: 'doc-1',
        manualWithoutSource: false,
        items: [
          expect.objectContaining({ name: 'Amlodipin' }),
          expect.objectContaining({ name: 'Metformin' }),
        ],
      }),
    ]);
    expect(memory.documents[0]).toMatchObject({
      status: 'approved',
      type: 'prescription',
      documentDate: '2026-10-01',
    });
  });

  it('người nhập chọn loại khác loại đã khai báo → lưu theo loại đã chọn và cập nhật loại chứng từ', async () => {
    const memory = manualDocument({ type: 'device_reading' });
    expect((await approveDocument(memory.repository, prescription())).ok).toBe(true);
    expect(memory.documents[0]).toMatchObject({ status: 'approved', type: 'prescription' });
  });

  it('SPEC-011: chứng từ awaiting_budget cũng nhập tay được', async () => {
    const memory = manualDocument({ status: 'awaiting_budget' });
    expect((await approveDocument(memory.repository, prescription())).ok).toBe(true);
    expect(memory.documents[0]!.status).toBe('approved');
  });

  it('kế thừa kiểm tra SPEC-010: thiếu ngày kê → ERR_DOCUMENT_DATE_REQUIRED, chứng từ vẫn manual_entry', async () => {
    const memory = manualDocument();
    expect(await approveDocument(memory.repository, prescription(null))).toEqual({
      ok: false,
      code: 'ERR_DOCUMENT_DATE_REQUIRED',
    });
    expect(memory.documents[0]).toMatchObject({ status: 'manual_entry', type: null });
    expect(memory.prescriptions).toEqual([]);
  });

  it('chứng từ đã loại bỏ → ERR_INVALID_STATE_TRANSITION', async () => {
    const memory = manualDocument({ status: 'rejected' });
    expect(await approveDocument(memory.repository, prescription())).toEqual({
      ok: false,
      code: 'ERR_INVALID_STATE_TRANSITION',
    });
  });
});
