import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApprovedDocumentResponse, DocumentDeletionImpact, HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const prescription = {
  type: 'prescription',
  issuedDate: vietnamDate(-40),
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
      totalQuantity: null,
    },
  ],
};

describe('API xóa chứng từ và xem trước tác động (SPEC-037, BR-048)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  // Đơn đã duyệt sinh một đợt; "Dùng lại đơn" thêm đợt thứ hai cùng dòng thuốc; đợt gốc đã kết thúc.
  async function fixture() {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const { documentId, key } = await seedPendingDocument(t, owner, prescription);
    const approved = await t.call(main, 'POST', `/api/source-documents/${documentId}/approve`, {
      type: 'prescription',
      data: prescription,
    });
    expect(approved.status).toBe(200);
    const saved = (await approved.json()) as ApprovedDocumentResponse;
    const itemId = saved.prescription!.items[0]!.id;
    await t.owner.query("UPDATE medication_courses SET status='ended' WHERE prescription_item_id=$1", [
      itemId,
    ]);
    const reused = await t.call(
      main,
      'POST',
      `/api/health-profiles/${profile.id}/prescriptions/${saved.prescription!.id}/reuse`,
      {
        startDate: vietnamDate(0),
        items: [{ prescriptionItemId: itemId, durationDays: 30, longTerm: false }],
      },
    );
    expect(reused.status).toBe(201);
    return { familyId, main, profile, documentId, key, itemId };
  }
  const count = async (table: string, column: string, value: string) =>
    Number((await t.owner.query(`SELECT count(*) FROM ${table} WHERE ${column}=$1`, [value])).rows[0].count);

  it('TC-412: deletion-impact đếm đúng đơn, dòng thuốc, mọi đợt và đợt đang dùng; no-store', async () => {
    const f = await fixture();
    const response = await t.call(f.main, 'GET', `/api/source-documents/${f.documentId}/deletion-impact`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()) as DocumentDeletionImpact).toEqual({
      prescriptions: 1,
      prescriptionItems: 1,
      labResults: 0,
      measurements: 0,
      medicationCourses: 2,
      activeMedicationCourses: 1,
    });
  });

  it('TC-411: DELETE 204 cascade đơn/dòng/đợt (cả đợt Dùng lại)/bản trích xuất, xóa object và receipt', async () => {
    const f = await fixture();
    const response = await t.call(f.main, 'DELETE', `/api/source-documents/${f.documentId}`, {
      confirm: 'XÓA',
    });
    expect(response.status).toBe(204);
    expect(await count('source_documents', 'id', f.documentId)).toBe(0);
    expect(await count('prescriptions', 'source_document_id', f.documentId)).toBe(0);
    expect(await count('prescription_items', 'id', f.itemId)).toBe(0);
    expect(await count('medication_courses', 'health_profile_id', f.profile.id)).toBe(0);
    expect(await count('extractions', 'source_document_id', f.documentId)).toBe(0);
    expect(await count('object_purges', 'family_id', f.familyId)).toBe(0);
    expect(t.objects.has(f.key)).toBe(false);
    const again = await t.call(f.main, 'DELETE', `/api/source-documents/${f.documentId}`, { confirm: 'XÓA' });
    expect(again.status).toBe(404);
  });

  it('TC-411: chứng từ ảnh NULL vẫn xóa được', async () => {
    const f = await fixture();
    await t.owner.query('UPDATE source_documents SET image_key=NULL, image_sha256=NULL WHERE id=$1', [
      f.documentId,
    ]);
    const response = await t.call(f.main, 'DELETE', `/api/source-documents/${f.documentId}`, {
      confirm: 'XÓA',
    });
    expect(response.status).toBe(204);
    expect(await count('source_documents', 'id', f.documentId)).toBe(0);
  });

  it('TC-413: member 403, xác nhận sai 422, hồ sơ rút đồng thuận ERR_CONSENT_REQUIRED; không xóa gì', async () => {
    const f = await fixture();
    const base = `/api/source-documents/${f.documentId}`;
    const member = await t.session(f.familyId, 'member', 'Thành viên');
    expect((await t.call(member, 'GET', `${base}/deletion-impact`)).status).toBe(403);
    expect((await t.call(member, 'DELETE', base, { confirm: 'XÓA' })).status).toBe(403);
    for (const body of [{ confirm: 'xoa' }, { confirm: 'XOA' }, {}]) {
      const response = await t.call(f.main, 'DELETE', base, body);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    await t.owner.query(
      "UPDATE health_profiles SET consent_status='withdrawn', consent_withdrawn_at=now(), consent_withdrawn_by=$2 WHERE id=$1",
      [f.profile.id, f.main.accountId],
    );
    for (const response of [
      await t.call(f.main, 'GET', `${base}/deletion-impact`),
      await t.call(f.main, 'DELETE', base, { confirm: 'XÓA' }),
    ]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
    expect(await count('source_documents', 'id', f.documentId)).toBe(1);
    expect(t.objects.has(f.key)).toBe(true);
  });
});
