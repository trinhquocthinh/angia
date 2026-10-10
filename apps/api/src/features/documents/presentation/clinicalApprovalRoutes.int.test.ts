import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  ApprovedDocumentResponse,
  HealthProfile,
  SourceDocument,
  SourceDocumentPage,
} from '@angia/contracts';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { PENDING_JPEG, seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const item = {
  name: 'Đường  Glucophage',
  strength: '500mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning', 'evening'],
  durationDays: 15,
  longTerm: false,
  note: 'Sau ăn',
  totalQuantity: 30,
};
const prescription = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: 'BV Tỉnh',
  diagnosis: 'Đái tháo đường típ 2 (E11)',
  items: [item, { ...item, name: 'Amlodipin', slots: ['morning'], durationDays: null, longTerm: true }],
};
const lab = {
  type: 'lab_result',
  resultDate: '2026-10-02',
  facility: null,
  items: [{ testName: 'HbA1c', value: '7,2', unit: '%', referenceRange: '4.0 - 6.0' }],
};

describe('Duyệt đơn thuốc/xét nghiệm, loại bỏ và phân trang chứng từ: route thật + RLS (E3-S3-T3)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const familyFixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const seed = (payload: object) => seedPendingDocument(t, owner, payload);
    return { familyId, main, profile, seed };
  };
  const approve = (user: SeededSession, id: string, type: string, data: object) =>
    t.call(user, 'POST', `/api/source-documents/${id}/approve`, { type, data });
  const page = async (user: SeededSession, query: string) =>
    (await (await t.call(user, 'GET', `/api/source-documents?${query}`)).json()) as SourceDocumentPage;

  it('lưu đơn thuốc nhiều dòng theo thứ tự, tên chuẩn hóa, tổng số lượng; ảnh gốc không đổi', async () => {
    const { main, seed } = await familyFixture();
    const { documentId, key } = await seed(prescription);
    const response = await approve(main, documentId, 'prescription', prescription);
    expect(response.status).toBe(200);
    const body = (await response.json()) as ApprovedDocumentResponse;
    expect(body.document).toMatchObject({ status: 'approved', documentDate: '2026-10-01' });
    expect(body.prescription).toMatchObject({
      sourceDocumentId: documentId,
      diagnosis: 'Đái tháo đường típ 2 (E11)',
      items: [
        { name: 'Đường  Glucophage', slots: ['morning', 'evening'], durationDays: 15, totalQuantity: 30 },
        { name: 'Amlodipin', durationDays: null, longTerm: true, totalQuantity: 30 },
      ],
    });
    const rows = await t.owner.query(
      `SELECT i.position, i.name_normalized, i.quantity_per_dose, i.total_quantity
       FROM prescription_items i JOIN prescriptions p ON p.id = i.prescription_id
       WHERE p.source_document_id = $1 ORDER BY i.position`,
      [documentId],
    );
    expect(rows.rows).toEqual([
      { position: 0, name_normalized: 'duong glucophage', quantity_per_dose: '1', total_quantity: '30' },
      { position: 1, name_normalized: 'amlodipin', quantity_per_dose: '1', total_quantity: '30' },
    ]);
    expect(t.objects.get(key)!.body).toEqual(PENDING_JPEG);
  });

  it('TC-031: thiếu ngày kê → ERR_DOCUMENT_DATE_REQUIRED; dòng thiếu liều → ERR_DOSE_INFO_MISSING chỉ rõ dòng', async () => {
    const { main, seed } = await familyFixture();
    const { documentId } = await seed(prescription);
    const noDate = await approve(main, documentId, 'prescription', { ...prescription, issuedDate: null });
    expect(noDate.status).toBe(422);
    expect(await noDate.json()).toMatchObject({ error: { code: 'ERR_DOCUMENT_DATE_REQUIRED' } });
    const items = [item, { ...item, slots: [], durationDays: null }];
    const missing = await approve(main, documentId, 'prescription', { ...prescription, items });
    expect(missing.status).toBe(422);
    expect(await missing.json()).toMatchObject({
      error: { code: 'ERR_DOSE_INFO_MISSING', details: { invalidItemIndexes: [1] } },
    });
    const state = await t.owner.query(
      `SELECT d.status, (SELECT count(*) FROM prescriptions p WHERE p.source_document_id = d.id) AS saved
       FROM source_documents d WHERE d.id = $1`,
      [documentId],
    );
    expect(state.rows[0]).toEqual({ status: 'pending_review', saved: '0' });
  });

  it('lưu phiếu xét nghiệm giữ nguyên văn giá trị; TC-035 duyệt lại bị từ chối', async () => {
    const { main, seed } = await familyFixture();
    const { documentId } = await seed(lab);
    const response = await approve(main, documentId, 'lab_result', lab);
    const body = (await response.json()) as ApprovedDocumentResponse;
    expect(body.labResults).toEqual([
      expect.objectContaining({ testName: 'HbA1c', value: '7,2', unit: '%', resultDate: '2026-10-02' }),
    ]);
    expect((await approve(main, documentId, 'lab_result', lab)).status).toBe(409);
  });

  it('loại bỏ chứng từ chờ duyệt/chờ nhập tay; đã duyệt thì ERR_INVALID_STATE_TRANSITION; nhóm khác như không tồn tại', async () => {
    const { main, seed } = await familyFixture();
    const pending = await seed(lab);
    const manual = await seed(lab);
    await t.owner.query("UPDATE source_documents SET status='manual_entry' WHERE id=$1", [manual.documentId]);
    const other = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/source-documents/${pending.documentId}/reject`),
      () => t.call(other, 'POST', `/api/source-documents/${randomUUID()}/reject`),
    );
    for (const { documentId, key } of [pending, manual]) {
      const response = await t.call(main, 'POST', `/api/source-documents/${documentId}/reject`);
      expect(((await response.json()) as SourceDocument).status).toBe('rejected');
      expect(t.objects.get(key)!.body).toEqual(PENDING_JPEG);
    }
    const again = await t.call(main, 'POST', `/api/source-documents/${pending.documentId}/reject`);
    expect(again.status).toBe(409);
    expect((await approve(main, pending.documentId, 'lab_result', lab)).status).toBe(409);
  });

  it('F09a: trang theo cursor ổn định, không trùng/sót; cursor nhóm khác cho trang rỗng; limit sai → 422', async () => {
    const { main, seed } = await familyFixture();
    const ids: string[] = [];
    for (let i = 0; i < 5; i += 1) ids.push((await seed(lab)).documentId);
    // Cùng created_at để kiểm thứ tự phụ theo id.
    await t.owner.query(
      "UPDATE source_documents SET created_at = '2026-10-09T00:00:00Z' WHERE id = ANY($1)",
      [ids.slice(1, 4)],
    );
    const first = await page(main, 'limit=2');
    const second = await page(main, `limit=2&cursor=${first.nextCursor}`);
    const third = await page(main, `limit=2&cursor=${second.nextCursor}`);
    expect(third.nextCursor).toBeNull();
    const seen = [first, second, third].flatMap((p) => p.items.map((d) => d.id));
    expect(seen).toHaveLength(5);
    expect(new Set(seen)).toEqual(new Set(ids));
    expect((await page(main, 'limit=50')).items.map((d) => d.id)).toEqual(seen);
    const foreign = await familyFixture();
    await foreign.seed(lab);
    expect(await page(foreign.main, `limit=2&cursor=${first.nextCursor}`)).toEqual({
      items: [],
      nextCursor: null,
    });
    expect((await t.call(main, 'GET', '/api/source-documents?limit=101')).status).toBe(422);
  });
});
