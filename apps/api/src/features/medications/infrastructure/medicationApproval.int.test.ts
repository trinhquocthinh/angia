import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApprovedDocumentResponse, HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const prescription = {
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
    {
      name: 'Metformin',
      strength: '500mg',
      quantityPerDose: 0.5,
      doseUnit: null,
      slots: ['morning', 'evening'],
      durationDays: null,
      longTerm: true,
      note: null,
      totalQuantity: null,
    },
  ],
};

// Dùng route + repository thật bằng role app; role owner chỉ tạo fixture/kiểm trạng thái DB.
describe('Phê duyệt tạo đợt thuốc nguyên tử và cô lập gia đình (E4-S1-T2)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const fixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const { documentId } = await seedPendingDocument(t, owner, prescription);
    const approve = (data: object = prescription) =>
      t.call(main, 'POST', `/api/source-documents/${documentId}/approve`, { type: 'prescription', data });
    return { familyId, main, profile, documentId, approve };
  };
  const courses = async (profileId: string) =>
    (
      await t.owner.query(
        `SELECT c.prescription_item_id, c.name, c.name_normalized, c.quantity_per_dose,
      c.dose_unit, c.slots, c.start_date::text, c.end_date::text, c.status, c.source
     FROM medication_courses c JOIN prescription_items i ON i.id = c.prescription_item_id
     WHERE c.health_profile_id = $1 ORDER BY i.position`,
        [profileId],
      )
    ).rows;
  const expectEmpty = async (profileId: string, documentId: string) => {
    expect(await courses(profileId)).toEqual([]);
    const rows = await t.owner.query(
      `SELECT d.status, (SELECT count(*) FROM prescriptions p WHERE p.source_document_id = d.id) AS saved
       FROM source_documents d WHERE d.id = $1`,
      [documentId],
    );
    expect(rows.rows[0]).toEqual({ status: 'pending_review', saved: '0' });
  };

  it('TC-043/045: tạo một đợt mỗi dòng, giữ liều thập phân và đơn vị null', async () => {
    const f = await fixture();
    const response = await f.approve();
    expect(response.status).toBe(200);
    const body = (await response.json()) as ApprovedDocumentResponse;
    expect(await courses(f.profile.id)).toEqual([
      {
        prescription_item_id: body.prescription!.items[0]!.id,
        name: 'Amlodipin',
        name_normalized: 'amlodipin',
        quantity_per_dose: '1',
        dose_unit: 'viên',
        slots: ['morning'],
        start_date: '2026-10-01',
        end_date: '2026-10-30',
        status: 'active',
        source: 'prescription',
      },
      {
        prescription_item_id: body.prescription!.items[1]!.id,
        name: 'Metformin',
        name_normalized: 'metformin',
        quantity_per_dose: '0.5',
        dose_unit: null,
        slots: ['morning', 'evening'],
        start_date: '2026-10-01',
        end_date: null,
        status: 'active',
        source: 'prescription',
      },
    ]);
  });

  it('TC-044: thiếu thời lượng không lưu đơn hoặc bất kỳ đợt nào', async () => {
    const f = await fixture();
    const data = { ...prescription, items: [{ ...prescription.items[0]!, durationDays: null }] };
    const response = await f.approve(data);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_DOSE_INFO_MISSING', details: { invalidItemIndexes: [0] } },
    });
    await expectEmpty(f.profile.id, f.documentId);
  });

  it('lỗi ghi đợt rollback cả đơn + dòng thuốc, chứng từ chưa approved', async () => {
    const f = await fixture();
    await t.owner.query(
      `ALTER TABLE medication_courses ADD CONSTRAINT test_course_write_failure CHECK (name <> 'Rollback')`,
    );
    try {
      const data = {
        ...prescription,
        items: [prescription.items[0]!, { ...prescription.items[1]!, name: 'Rollback' }],
      };
      expect((await f.approve(data)).status).toBe(500);
      await expectEmpty(f.profile.id, f.documentId);
    } finally {
      await t.owner.query('ALTER TABLE medication_courses DROP CONSTRAINT test_course_write_failure');
    }
  });

  it('lỗi cập nhật approved sau khi ghi đợt cũng rollback toàn bộ dữ liệu', async () => {
    const f = await fixture();
    await t.owner.query(
      `ALTER TABLE source_documents ADD CONSTRAINT test_approve_failure CHECK (id <> '${f.documentId}' OR status <> 'approved')`,
    );
    try {
      expect((await f.approve()).status).toBe(500);
      await expectEmpty(f.profile.id, f.documentId);
    } finally {
      await t.owner.query('ALTER TABLE source_documents DROP CONSTRAINT test_approve_failure');
    }
  });

  it('duyệt lại và duyệt đồng thời chỉ lưu đúng một bộ đơn + đợt', async () => {
    const f = await fixture();
    const responses = await Promise.all([f.approve(), f.approve()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect((await f.approve()).status).toBe(409);
    expect(await courses(f.profile.id)).toHaveLength(2);
    const rows = await t.owner.query('SELECT count(*) FROM prescriptions WHERE source_document_id = $1', [
      f.documentId,
    ]);
    expect(rows.rows[0].count).toBe('1');
  });

  it('chứng từ manual_entry và đơn nhập trực tiếp đều tạo đợt', async () => {
    const f = await fixture();
    await t.owner.query(`UPDATE source_documents SET status = 'manual_entry', type = NULL WHERE id = $1`, [
      f.documentId,
    ]);
    expect((await f.approve()).status).toBe(200);
    expect(await courses(f.profile.id)).toHaveLength(2);
    const direct = await fixture();
    await acceptConsentInvitation(t, direct.main, direct.profile.id);
    const response = await t.call(
      direct.main,
      'POST',
      `/api/health-profiles/${direct.profile.id}/manual-records`,
      {
        type: 'prescription',
        data: prescription,
      },
    );
    expect(response.status).toBe(200);
    expect(await courses(direct.profile.id)).toHaveLength(2);
  });

  it('gia đình khác không thể duyệt hay nhập đơn cho hồ sơ của chủ sở hữu', async () => {
    const f = await fixture();
    const other = await t.session(await t.family());
    const payload = { type: 'prescription', data: prescription };
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/source-documents/${f.documentId}/approve`, payload),
      () => t.call(other, 'POST', `/api/source-documents/${randomUUID()}/approve`, payload),
    );
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/health-profiles/${f.profile.id}/manual-records`, payload),
      () => t.call(other, 'POST', `/api/health-profiles/${randomUUID()}/manual-records`, payload),
    );
    await expectEmpty(f.profile.id, f.documentId);
  });
});
