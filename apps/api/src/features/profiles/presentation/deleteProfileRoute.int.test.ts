import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import {
  manualCourse as course,
  manualPrescription,
  manualReading,
} from '@src/shared/test/healthDataFixtures.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { seedAccount } from '@src/shared/test/seedAuthFixtures.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { seedReminder } from '@src/shared/test/seedReminder.js';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const base = '/api/health-profiles';
const BY_PROFILE = [
  'upload_batches',
  'source_documents',
  'measurements',
  'prescriptions',
  'lab_results',
  'medication_courses',
  'adherence_periods',
  'dose_slots',
  'reminder_recipients',
  'reminders',
];

describe('SPEC-007: xóa triệt để hồ sơ qua route thật, RLS và pg-boss', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const remove = (user: SeededSession, id: string, confirmName: unknown = 'Mẹ') =>
    t.call(user, 'DELETE', `${base}/${id}`, { confirmName });
  const purgeJobs = async (profileId: string) =>
    (
      await t.owner.query(
        `SELECT data, start_after > now() + interval '590 seconds' AS delayed
         FROM pgboss.job WHERE name = 'purge-profile-objects' AND data->>'profileId' = $1`,
        [profileId],
      )
    ).rows as { data: { familyId: string; profileId: string }; delayed: boolean }[];
  const count = async (table: string, profileId: string, column = 'health_profile_id') =>
    (await t.owner.query(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1`, [profileId])).rows[0]
      .n as number;
  const keysUnder = (familyId: string, profileId: string) =>
    [...t.objects.keys()].filter((key) => key.startsWith(`families/${familyId}/profiles/${profileId}/`));

  // Hồ sơ "Mẹ" đủ loại dữ liệu phụ thuộc + tài khoản liên kết; hồ sơ "Bố" cùng gia đình để kiểm không xóa lan.
  const fixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const linked = await seedAccount(t.owner, { familyId, familyRole: 'member', displayName: 'Mẹ' });
    const create = async (displayName: string, linkedAccountId?: string) =>
      (await (
        await t.call(main, 'POST', base, { displayName, ...(linkedAccountId ? { linkedAccountId } : {}) })
      ).json()) as HealthProfile;
    const [mother, father] = [await create('Mẹ', linked), await create('Bố')];
    await acceptConsentInvitation(t, main, mother.id);
    const owner = { familyId, profileId: mother.id, accountId: main.accountId };
    for (let i = 0; i < 5; i++) {
      const { key } = await seedPendingDocument(t, owner, manualReading);
      const folder = key.replace('original.jpg', '');
      t.objects.set(`${folder}previews/${randomUUID()}.webp`, {
        body: new Uint8Array(1),
        contentType: 'image/webp',
      });
      t.objects.set(`${folder}ocr/${randomUUID()}/${randomUUID()}.png`, {
        body: new Uint8Array(1),
        contentType: 'image/png',
      });
    }
    const manual = (body: object) => t.call(main, 'POST', `${base}/${mother.id}/manual-records`, body);
    for (let day = 1; day <= 10; day++) {
      const data = { ...manualReading, measuredAt: `2026-10-${String(day).padStart(2, '0')}` };
      expect((await manual({ type: 'device_reading', data })).status).toBe(200);
    }
    expect((await manual({ type: 'prescription', data: manualPrescription })).status).toBe(200);
    expect((await t.call(main, 'POST', `${base}/${mother.id}/medication-courses`, course)).status).toBe(201);
    const slots = { slots: { morning: '07:00' } };
    expect((await t.call(main, 'PUT', `${base}/${mother.id}/dose-slots`, slots)).status).toBe(200);
    const reminderId = await seedReminder(t.owner, familyId, mother.id, main.accountId);
    await t.owner.query(
      `INSERT INTO reminder_deliveries(id,family_id,reminder_id,status) VALUES ($1,$2,$3,'pending')`,
      [randomUUID(), familyId, reminderId],
    );
    const fatherDoc = await seedPendingDocument(t, { ...owner, profileId: father.id }, manualReading);
    return { familyId, main, linked, mother, father, fatherKey: fatherDoc.key };
  };

  it('TC-018: xóa sạch DB và ảnh của hồ sơ, giữ tài khoản liên kết, không đụng hồ sơ khác', async () => {
    const f = await fixture();
    const other = await fixture();
    expect(keysUnder(f.familyId, f.mother.id)).toHaveLength(15);
    const before = await snapshotHealthTables(t.owner);

    const response = await remove(f.main, f.mother.id);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');

    for (const table of BY_PROFILE)
      expect({ table, n: await count(table, f.mother.id) }).toEqual({ table, n: 0 });
    for (const table of ['consent_invitations', 'consent_legacy_attestations'])
      expect({ table, n: await count(table, f.mother.id, 'profile_id') }).toEqual({ table, n: 0 });
    const gone = await t.owner.query('SELECT id FROM health_profiles WHERE id = $1', [f.mother.id]);
    expect(gone.rows).toEqual([]);
    const familyRows = async (table: string) =>
      (await t.owner.query(`SELECT count(*)::int AS n FROM ${table} WHERE family_id = $1`, [f.familyId]))
        .rows[0].n as number;
    expect(await familyRows('health_profiles')).toBe(1);
    expect(await familyRows('extractions')).toBe(1);
    expect(await familyRows('prescription_items')).toBe(0);
    expect(await familyRows('reminder_deliveries')).toBe(0);
    const account = await t.owner.query('SELECT health_profile_id FROM accounts WHERE id = $1', [f.linked]);
    expect(account.rows).toEqual([{ health_profile_id: null }]);
    expect(keysUnder(f.familyId, f.mother.id)).toEqual([]);
    expect(t.objects.has(f.fatherKey)).toBe(true);
    expect(keysUnder(other.familyId, other.mother.id)).toHaveLength(15);
    expect(await purgeJobs(f.mother.id)).toEqual([
      { data: { familyId: f.familyId, profileId: f.mother.id }, delayed: true },
    ]);
    // Gia đình khác giữ nguyên toàn bộ dòng.
    const after = await snapshotHealthTables(t.owner);
    const ofOther = (rows: unknown) =>
      (rows as { family_id?: string }[]).filter((row) => row.family_id === other.familyId);
    for (const table of Object.keys(before)) expect(ofOther(after[table])).toEqual(ofOther(before[table]));
  });

  it('TC-019: tên sai hoa/thường hoặc thừa khoảng trắng → 422, không xóa gì, không có job', async () => {
    const f = await fixture();
    const before = await snapshotHealthTables(t.owner);
    const objects = [...t.objects.keys()].sort();
    for (const confirmName of ['me', 'Mẹ ']) {
      const response = await remove(f.main, f.mother.id, confirmName);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONFIRMATION_MISMATCH' } });
    }
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    expect([...t.objects.keys()].sort()).toEqual(objects);
    expect(await purgeJobs(f.mother.id)).toEqual([]);
  });

  it('TC-369: gia đình khác nhận phản hồi như ID không tồn tại; member, thiếu CSRF, thiếu tên bị chặn', async () => {
    const f = await fixture();
    const attacker = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => remove(attacker, f.mother.id),
      () => remove(attacker, randomUUID()),
    );
    const member = await t.session(f.familyId, 'member');
    expect((await remove(member, f.mother.id)).status).toBe(403);
    const noCsrf = await t.app.request(`${base}/${f.mother.id}`, {
      method: 'DELETE',
      headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ confirmName: 'Mẹ' }),
    });
    expect(noCsrf.status).toBe(403);
    const invalid = await t.call(f.main, 'DELETE', `${base}/${f.mother.id}`, {});
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    expect(await count('source_documents', f.mother.id)).toBe(5);
  });

  it('TC-369: hai lệnh xóa đồng thời → một 204, một 404, đúng một job', async () => {
    const f = await fixture();
    const statuses = (await Promise.all([remove(f.main, f.mother.id), remove(f.main, f.mother.id)]))
      .map((r) => r.status)
      .sort();
    expect(statuses).toEqual([204, 404]);
    expect(await purgeJobs(f.mother.id)).toHaveLength(1);
  });

  it('S3 lỗi sau COMMIT → vẫn 204, dữ liệu đã xóa, job vét vẫn có', async () => {
    const f = await fixture();
    t.failNextDeletePrefix();
    expect((await remove(f.main, f.mother.id)).status).toBe(204);
    expect(await count('source_documents', f.mother.id)).toBe(0);
    expect(keysUnder(f.familyId, f.mother.id)).toHaveLength(15);
    expect(await purgeJobs(f.mother.id)).toHaveLength(1);
  });
});
