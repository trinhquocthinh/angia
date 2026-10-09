import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApprovedDocumentResponse, HealthProfile, ManualRecordsResponse } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const item = {
  name: 'Amlodipin',
  strength: '5mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: null,
};
const prescription = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: null,
  diagnosis: null,
  items: [item, { ...item, name: 'Metformin', strength: '500mg' }],
};
const bloodPressure = {
  type: 'device_reading',
  measuredAt: '2026-10-06',
  measuredTime: null,
  kind: 'blood_pressure',
  systolic: 130,
  diastolic: 85,
  pulse: null,
  glucoseValue: null,
  glucoseUnit: null,
};

describe('Nhập liệu thủ công: route thật + RLS (SPEC-011, E3-S4-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const familyFixture = async (consent: boolean) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    if (consent) await acceptConsentInvitation(t, main, profile.id);
    return { familyId, main, profile };
  };

  it('TC-036: chứng từ manual_entry chưa rõ loại, nhập đơn thuốc 2 dòng → đơn gắn chứng từ, approved', async () => {
    const { familyId, main, profile } = await familyFixture(false);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const { documentId } = await seedPendingDocument(t, owner, bloodPressure);
    await t.owner.query(`UPDATE source_documents SET status='manual_entry', type=NULL WHERE id=$1`, [
      documentId,
    ]);
    const response = await t.call(main, 'POST', `/api/source-documents/${documentId}/approve`, {
      type: 'prescription',
      data: prescription,
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as ApprovedDocumentResponse;
    expect(body.document).toMatchObject({
      status: 'approved',
      type: 'prescription',
      documentDate: '2026-10-01',
    });
    expect(body.prescription).toMatchObject({ sourceDocumentId: documentId, manualWithoutSource: false });
    expect(body.prescription?.items).toHaveLength(2);
  });

  it('TC-037: nhập trực tiếp huyết áp 130/85 ngày 06/10 → lưu với manual_without_source = true', async () => {
    const { main, profile } = await familyFixture(true);
    const response = await t.call(main, 'POST', `/api/health-profiles/${profile.id}/manual-records`, {
      type: 'device_reading',
      data: bloodPressure,
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as ManualRecordsResponse;
    expect(body.measurements).toEqual([
      expect.objectContaining({
        sourceDocumentId: null,
        manualWithoutSource: true,
        measuredOn: '2026-10-06',
        systolic: 130,
        diastolic: 85,
      }),
    ]);
    const rows = await t.owner.query(
      'SELECT source_document_id, manual_without_source FROM measurements WHERE health_profile_id = $1',
      [profile.id],
    );
    expect(rows.rows).toEqual([{ source_document_id: null, manual_without_source: true }]);
    const listed = await t.call(main, 'GET', `/api/health-profiles/${profile.id}/measurements`);
    expect(await listed.json()).toEqual([expect.objectContaining({ manualWithoutSource: true })]);
  });

  it('BR-009: hồ sơ chưa đồng thuận → 409 ERR_CONSENT_REQUIRED, không lưu', async () => {
    const { main, profile } = await familyFixture(false);
    const response = await t.call(main, 'POST', `/api/health-profiles/${profile.id}/manual-records`, {
      type: 'device_reading',
      data: bloodPressure,
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    const rows = await t.owner.query('SELECT 1 FROM measurements WHERE health_profile_id = $1', [profile.id]);
    expect(rows.rowCount).toBe(0);
  });

  it('kế thừa SPEC-010: đơn nhập trực tiếp thiếu buổi dùng → 422 ERR_DOSE_INFO_MISSING chỉ rõ dòng', async () => {
    const { main, profile } = await familyFixture(true);
    const items = [item, { ...item, slots: [] }];
    const response = await t.call(main, 'POST', `/api/health-profiles/${profile.id}/manual-records`, {
      type: 'prescription',
      data: { ...prescription, items },
    });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_DOSE_INFO_MISSING', details: { invalidItemIndexes: [1] } },
    });
  });

  it('member không được nhập trực tiếp (BR-005)', async () => {
    const { familyId, profile } = await familyFixture(true);
    const member = await t.session(familyId, 'member');
    const response = await t.call(member, 'POST', `/api/health-profiles/${profile.id}/manual-records`, {
      type: 'device_reading',
      data: bloodPressure,
    });
    expect(response.status).toBe(403);
  });
});
