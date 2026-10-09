import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const item = (name: string, strength: string) => ({
  name,
  strength,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: null,
});
const prescription = (names: [string, string]) => ({
  type: 'prescription',
  issuedDate: '2026-09-05',
  facility: 'BV Tỉnh',
  diagnosis: null,
  items: [item(names[0], '5mg'), item(names[1], '500 mg')],
});
const lab = (items: { testName: string; value: string }[]) => ({
  type: 'lab_result',
  resultDate: '2026-10-02',
  facility: null,
  items: items.map((row) => ({ ...row, unit: null, referenceRange: null })),
});
const reading = (measuredTime: string | null) => ({
  type: 'device_reading',
  measuredAt: '2026-10-06',
  measuredTime,
  kind: 'glucose',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue: 6.8,
  glucoseUnit: 'mmol/L',
});

describe('Kiểm trùng chứng từ: route thật + RLS (SPEC-012, BR-017, E3-S5-T1)', () => {
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
    const seed = async (payload: { type: string }) =>
      (await seedPendingDocument(t, owner, payload)).documentId;
    return { main, profile, seed };
  };
  const approve = (user: SeededSession, id: string, data: { type: string }, confirmDuplicate?: boolean) =>
    t.call(user, 'POST', `/api/source-documents/${id}/approve`, { type: data.type, data, confirmDuplicate });
  const manual = (user: SeededSession, profileId: string, data: { type: string }) =>
    t.call(user, 'POST', `/api/health-profiles/${profileId}/manual-records`, { type: data.type, data });

  it('TC-038/TC-039: đơn trùng → 409 kèm chứng từ trùng, chứng từ vẫn chờ duyệt; xác nhận thì lưu thêm', async () => {
    const { main, seed } = await familyFixture();
    const first = await seed(prescription(['Amlodipin', 'Metformin']));
    const second = await seed(prescription(['amlodipin', 'METFORMIN']));
    expect((await approve(main, first, prescription(['Amlodipin', 'Metformin']))).status).toBe(200);
    const again = prescription(['amlodipin', 'METFORMIN']);
    again.items[1]!.strength = '500MG';
    const duplicate = await approve(main, second, again);
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({
      error: {
        code: 'ERR_DUPLICATE_UNCONFIRMED',
        details: {
          duplicateOf: first,
          recordDate: '2026-09-05',
          facility: 'BV Tỉnh',
          savedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      },
    });
    const state = await t.owner.query('SELECT status FROM source_documents WHERE id = $1', [second]);
    expect(state.rows[0]).toEqual({ status: 'pending_review' });
    expect((await approve(main, second, again, true)).status).toBe(200);
  });

  it('TC-040: hồ sơ khác hoặc gia đình khác có đơn giống hệt → không trùng (RLS không lộ bản của nhóm khác)', async () => {
    const mother = await familyFixture();
    const content = prescription(['Amlodipin', 'Metformin']);
    expect((await approve(mother.main, await mother.seed(content), content)).status).toBe(200);
    const created = await t.call(mother.main, 'POST', '/api/health-profiles', { displayName: 'Ba' });
    const father = (await created.json()) as HealthProfile;
    await acceptConsentInvitation(t, mother.main, father.id);
    expect((await manual(mother.main, father.id, content)).status).toBe(200);
    const other = await familyFixture();
    expect((await approve(other.main, await other.seed(content), content)).status).toBe(200);
  });

  it('nhập trực tiếp: trùng bản đã duyệt → 409; xét nghiệm gom theo từng lần lưu', async () => {
    const { main, profile, seed } = await familyFixture();
    await acceptConsentInvitation(t, main, profile.id);
    const hba1c = lab([{ testName: 'HbA1c', value: '7,2' }]);
    expect((await approve(main, await seed(hba1c), hba1c)).status).toBe(200);
    const duplicate = await manual(main, profile.id, lab([{ testName: 'hba1c', value: ' 7,2' }]));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({ error: { details: { facility: null } } });
    expect((await manual(main, profile.id, lab([{ testName: 'Glucose', value: '6,8' }]))).status).toBe(200);
    const both = lab([
      { testName: 'HbA1c', value: '7,2' },
      { testName: 'Glucose', value: '6,8' },
    ]);
    expect((await manual(main, profile.id, both)).status).toBe(200);
  });

  it('số đo nhập trực tiếp trùng bản nhập trực tiếp → duplicateOf null; khác giờ đo thì lưu', async () => {
    const { main, profile } = await familyFixture();
    await acceptConsentInvitation(t, main, profile.id);
    expect((await manual(main, profile.id, reading('07:30'))).status).toBe(200);
    const duplicate = await manual(main, profile.id, reading(null));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({
      error: { code: 'ERR_DUPLICATE_UNCONFIRMED', details: { duplicateOf: null, recordDate: '2026-10-06' } },
    });
    expect((await manual(main, profile.id, reading('19:30'))).status).toBe(200);
  });
});
