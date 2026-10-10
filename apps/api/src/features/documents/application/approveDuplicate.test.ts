import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { reviewDocument } from '@src/shared/test/reviewDocumentFixture.js';
import type { ApprovalDraft } from './approvalDrafts.js';
import { approveDocument } from './approveDocument.js';
import { createManualRecords } from './createManualRecords.js';

const item = (name: string, strength: string) => ({
  name,
  strength,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning' as const],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: null,
});
const prescription = (names: [string, string], issuedDate: string | null = '2026-09-05') => ({
  type: 'prescription' as const,
  data: {
    type: 'prescription' as const,
    issuedDate,
    facility: 'BV Tỉnh',
    diagnosis: null,
    items: [item(names[0], '5mg'), item(names[1], '500mg')],
  },
});
const lab = (value: string) => ({
  type: 'lab_result' as const,
  data: {
    type: 'lab_result' as const,
    resultDate: '2026-10-01',
    facility: 'TTYT',
    items: [{ testName: 'HbA1c', value, unit: null as string | null, referenceRange: null }],
  },
});
const reading = (measuredTime: string | null) => ({
  type: 'device_reading' as const,
  data: {
    type: 'device_reading' as const,
    measuredAt: '2026-10-06',
    measuredTime,
    kind: 'blood_pressure' as const,
    systolic: 130,
    diastolic: 85,
    pulse: null,
    glucoseValue: null,
    glucoseUnit: null,
  },
});
const MOTHER = prescription(['Amlodipin', 'Metformin']);
const AGAIN = prescription(['amlodipin', 'METFORMIN']);

// Hồ sơ "Mẹ" (me) và "Ba" (father), mỗi người một chứng từ chờ duyệt cùng loại.
function setup(type: 'prescription' | 'lab_result' | 'device_reading' = 'prescription') {
  const memory = createMemoryReviewRepository(
    [
      reviewDocument({ id: 'doc-1', type }),
      reviewDocument({ id: 'doc-2', type }),
      reviewDocument({ id: 'doc-father', type, healthProfileId: 'father' }),
    ],
    {},
    [
      { id: 'me', familyId: 'family-a', consentStatus: 'confirmed' },
      { id: 'father', familyId: 'family-a', consentStatus: 'confirmed' },
    ],
  );
  const approve = (documentId: string, draft: ApprovalDraft) =>
    approveDocument(memory.repository, { ...draft, familyId: 'family-a', documentId });
  const manual = (profileId: string, draft: ApprovalDraft) =>
    createManualRecords(memory.repository, { ...draft, familyId: 'family-a', profileId });
  return { memory, approve, manual };
}

describe('Kiểm trùng chứng từ khi duyệt (SPEC-012, BR-017)', () => {
  it('TC-038: "Mẹ" đã có đơn 05/09, duyệt đơn 05/09 tên khác hoa/thường → ERR_DUPLICATE_UNCONFIRMED kèm ID chứng từ trùng', async () => {
    const { memory, approve } = setup();
    expect((await approve('doc-1', MOTHER)).ok).toBe(true);
    expect(await approve('doc-2', AGAIN)).toEqual({
      ok: false,
      code: 'ERR_DUPLICATE_UNCONFIRMED',
      duplicate: {
        duplicateOf: 'doc-1',
        recordDate: '2026-09-05',
        facility: 'BV Tỉnh',
        savedAt: expect.any(Date),
      },
    });
    expect(memory.prescriptions).toHaveLength(1);
    expect(memory.documents[1]!.status).toBe('pending_review');
  });

  it('TC-039: gửi lại với confirmDuplicate = true → lưu thêm đơn thứ hai', async () => {
    const { memory, approve } = setup();
    await approve('doc-1', MOTHER);
    expect((await approve('doc-2', { ...AGAIN, confirmDuplicate: true })).ok).toBe(true);
    expect(memory.prescriptions).toHaveLength(2);
    expect(memory.documents[1]!.status).toBe('approved');
  });

  it('TC-040: đơn 05/09 của "Ba" giống hệt đơn của "Mẹ" → không trùng, lưu bình thường', async () => {
    const { memory, approve } = setup();
    await approve('doc-1', MOTHER);
    expect((await approve('doc-father', AGAIN)).ok).toBe(true);
    expect(memory.prescriptions).toHaveLength(2);
  });

  it('kiểm nghiệp vụ trước kiểm trùng: thiếu ngày kê vẫn trả ERR_DOCUMENT_DATE_REQUIRED', async () => {
    const { approve } = setup();
    await approve('doc-1', MOTHER);
    const missingDate = prescription(['amlodipin', 'METFORMIN'], null);
    expect(await approve('doc-2', missingDate)).toMatchObject({ code: 'ERR_DOCUMENT_DATE_REQUIRED' });
  });

  it('xét nghiệm: cùng ngày, cùng chỉ số và giá trị → trùng; khác giá trị → lưu', async () => {
    const { approve } = setup('lab_result');
    await approve('doc-1', lab('7.2'));
    expect(await approve('doc-2', lab('7.2 '))).toMatchObject({
      code: 'ERR_DUPLICATE_UNCONFIRMED',
      duplicate: { duplicateOf: 'doc-1', facility: 'TTYT' },
    });
    expect((await approve('doc-2', lab('7.3'))).ok).toBe(true);
  });

  it('số đo: cùng giá trị, bản mới không ghi giờ → trùng; khác giờ → lưu', async () => {
    const { approve } = setup('device_reading');
    await approve('doc-1', reading('07:30'));
    expect(await approve('doc-2', reading(null))).toMatchObject({
      code: 'ERR_DUPLICATE_UNCONFIRMED',
      duplicate: { duplicateOf: 'doc-1', recordDate: '2026-10-06', facility: null },
    });
    expect((await approve('doc-2', reading('19:30'))).ok).toBe(true);
  });
});

describe('Kiểm trùng khi nhập trực tiếp không ảnh (SPEC-011 kế thừa SPEC-012)', () => {
  it('bản trùng là bản nhập trực tiếp → duplicateOf = null', async () => {
    const { manual } = setup();
    expect((await manual('me', MOTHER)).ok).toBe(true);
    expect(await manual('me', AGAIN)).toMatchObject({
      code: 'ERR_DUPLICATE_UNCONFIRMED',
      duplicate: { duplicateOf: null, recordDate: '2026-09-05' },
    });
    expect((await manual('me', { ...AGAIN, confirmDuplicate: true })).ok).toBe(true);
  });

  it('duyệt chứng từ trùng với bản nhập trực tiếp trước đó cũng bị chặn', async () => {
    const { approve, manual } = setup('lab_result');
    await manual('me', lab('7.2'));
    expect(await approve('doc-1', lab('7.2'))).toMatchObject({
      code: 'ERR_DUPLICATE_UNCONFIRMED',
      duplicate: { duplicateOf: null },
    });
  });

  it('xét nghiệm nhập trực tiếp: mỗi lần lưu là một nhóm riêng, không gộp các lần với nhau', async () => {
    const { manual } = setup('lab_result');
    const glucose = { testName: 'Glucose', value: '6.8', unit: null, referenceRange: null };
    const glucoseOnly = lab('6.8');
    glucoseOnly.data.items = [glucose];
    await manual('me', lab('7.2'));
    await manual('me', glucoseOnly);
    const bothTests = lab('7.2');
    bothTests.data.items.push(glucose);
    expect((await manual('me', bothTests)).ok).toBe(true);
  });
});
