import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  ATTESTATION,
  PROFILE_BASE,
  linkAccountToProfile,
  profileConsentFixture,
} from '@src/shared/test/profileConsentFixture.js';

const UNLINK = '/api/me/profile-link/unlink';

describe('SPEC-050: gỡ và chuyển liên kết tài khoản — PostgreSQL thật và NOBYPASSRLS', () => {
  let t: ProfileTestApp;
  let admin: SeededSession;
  beforeAll(async () => {
    t = await startProfileTestApp();
    admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true, displayName: 'Quản trị' }));
  });
  afterAll(async () => t?.stop());

  const linkedSetup = async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create({ consent: ATTESTATION, displayName: 'Mẹ' });
    const member = await t.session(f.familyId, 'member', 'Bà M');
    await linkAccountToProfile(t, f.main, member, profile.id);
    const path = `/api/admin/families/${f.familyId}/profiles`;
    const transfer = (accountId: string | null, profileId = profile.id, familyPath = path) =>
      t.call(admin, 'PUT', `${familyPath}/${profileId}/linked-account`, { accountId });
    return { f, profile, member, path, transfer };
  };
  const linkedProfileOf = async (accountId: string) =>
    (await t.owner.query('SELECT health_profile_id FROM accounts WHERE id=$1', [accountId])).rows[0]
      .health_profile_id;
  const eventsOf = async (profileId: string) =>
    (
      await t.owner.query(
        `SELECT action, actor_account_id, actor_role, from_account_id, to_account_id
           FROM profile_link_events WHERE profile_id=$1 AND action <> 'link'`,
        [profileId],
      )
    ).rows;
  const seedRecipient = (familyId: string, profileId: string, accountId: string) =>
    t.owner.query(
      'INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [profileId, familyId, accountId],
    );
  const recipientsOf = async (profileId: string) =>
    (await t.owner.query('SELECT 1 FROM reminder_recipients WHERE health_profile_id=$1', [profileId])).rows;

  it('TC-560: chủ hồ sơ tự gỡ — 204, không còn liên kết, dữ liệu sức khỏe và đồng thuận giữ nguyên, có nhật ký', async () => {
    const { f, profile, member } = await linkedSetup();
    await seedRecipient(f.familyId, profile.id, f.main.accountId);
    const measured = await t.call(f.main, 'POST', `${PROFILE_BASE}/${profile.id}/manual-records`, {
      type: 'device_reading',
      data: {
        type: 'device_reading',
        measuredAt: '2026-10-06',
        measuredTime: null,
        kind: 'blood_pressure',
        systolic: 130,
        diastolic: 85,
        pulse: null,
        glucoseValue: null,
        glucoseUnit: null,
      },
    });
    expect(measured.status).toBe(200);
    const before = await snapshotHealthTables(t.owner);
    const denied = await t.call(member, 'POST', UNLINK, { confirm: false });
    expect(denied.status).toBe(422);
    expect(await snapshotHealthTables(t.owner)).toEqual(before);

    expect((await t.call(member, 'POST', UNLINK, { confirm: true })).status).toBe(204);

    expect(await linkedProfileOf(member.accountId)).toBeNull();
    expect(await recipientsOf(profile.id)).toEqual([]);
    expect(await eventsOf(profile.id)).toEqual([
      {
        action: 'unlink',
        actor_account_id: member.accountId,
        actor_role: 'owner',
        from_account_id: member.accountId,
        to_account_id: null,
      },
    ]);
    const after = await snapshotHealthTables(t.owner);
    expect(after.health_profiles).toEqual(before.health_profiles);
    expect(after.measurements).toEqual(before.measurements);
    expect(after.measurements).toHaveLength(1);
    const recipients = await t.call(f.main, 'GET', `${PROFILE_BASE}/${profile.id}/reminder-recipients`);
    expect(await recipients.json()).toMatchObject({ recipients: [] });
  });

  it('TC-560: tài khoản không có hồ sơ liên kết gỡ lần nữa nhận 404', async () => {
    const { member } = await linkedSetup();
    expect((await t.call(member, 'POST', UNLINK, { confirm: true })).status).toBe(204);
    expect((await t.call(member, 'POST', UNLINK, { confirm: true })).status).toBe(404);
  });

  it('TC-561: main không phải admin nhận 403 ở route quản trị, không có route gỡ riêng cho main', async () => {
    const { f, profile, member, path } = await linkedSetup();
    const before = await snapshotHealthTables(t.owner);
    const put = await t.call(f.main, 'PUT', `${path}/${profile.id}/linked-account`, { accountId: null });
    expect(put.status).toBe(403);
    expect(await put.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect((await t.call(f.main, 'GET', path)).status).toBe(403);
    // Main không liên kết hồ sơ nên route tự gỡ chỉ thấy 404, không chạm liên kết của người khác.
    expect((await t.call(f.main, 'POST', UNLINK, { confirm: true })).status).toBe(404);
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    expect(await linkedProfileOf(member.accountId)).toBe(profile.id);
  });

  it('TC-562: admin chuyển sang N — M về null, N liên kết, xóa người nhận, nhật ký transfer/admin', async () => {
    const { f, profile, member, transfer } = await linkedSetup();
    const other = await t.session(f.familyId, 'member', 'Bà N');
    await seedRecipient(f.familyId, profile.id, f.main.accountId);
    const consentBefore = (await f.snapshot(profile.id)).profile;

    const response = await transfer(other.accountId);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: profile.id,
      displayName: 'Mẹ',
      linkedAccount: { id: other.accountId, displayName: 'Bà N' },
    });
    expect(await linkedProfileOf(member.accountId)).toBeNull();
    expect(await linkedProfileOf(other.accountId)).toBe(profile.id);
    expect(await recipientsOf(profile.id)).toEqual([]);
    expect(await eventsOf(profile.id)).toEqual([
      {
        action: 'transfer',
        actor_account_id: admin.accountId,
        actor_role: 'admin',
        from_account_id: member.accountId,
        to_account_id: other.accountId,
      },
    ]);
    expect((await f.snapshot(profile.id)).profile).toEqual(consentBefore);
  });

  it('TC-562: admin gán tài khoản cho hồ sơ chưa liên kết thu hồi luôn link đang chờ', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    await f.invite(profile.id);
    const other = await t.session(f.familyId, 'member', 'Bà N');
    const response = await t.call(
      admin,
      'PUT',
      `/api/admin/families/${f.familyId}/profiles/${profile.id}/linked-account`,
      { accountId: other.accountId },
    );
    expect(response.status).toBe(200);
    expect(await eventsOf(profile.id)).toMatchObject([
      { action: 'transfer', from_account_id: null, to_account_id: other.accountId },
    ]);
    const saved = await f.snapshot(profile.id);
    expect(saved.invitations[0].revoked_at).not.toBeNull();
  });

  it('SPEC-050: admin gửi accountId null là gỡ; hồ sơ đã không liên kết thì không đổi gì', async () => {
    const { f, profile, member, transfer } = await linkedSetup();
    await seedRecipient(f.familyId, profile.id, f.main.accountId);
    const response = await transfer(null);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: profile.id, displayName: 'Mẹ', linkedAccount: null });
    expect(await linkedProfileOf(member.accountId)).toBeNull();
    expect(await recipientsOf(profile.id)).toEqual([]);
    const events = [
      {
        action: 'unlink',
        actor_account_id: admin.accountId,
        actor_role: 'admin',
        from_account_id: member.accountId,
        to_account_id: null,
      },
    ];
    expect(await eventsOf(profile.id)).toEqual(events);

    await seedRecipient(f.familyId, profile.id, f.main.accountId);
    expect((await transfer(null)).status).toBe(200);
    expect(await eventsOf(profile.id)).toEqual(events);
    expect(await recipientsOf(profile.id)).toHaveLength(1);
  });

  it('TC-563: đích đã liên kết hồ sơ khác → 409; đích khác gia đình hoặc hồ sơ sai → 404; không đổi gì', async () => {
    const { f, profile, member, transfer, path } = await linkedSetup();
    const second = await f.create({ consent: ATTESTATION, displayName: 'Bố' });
    const busy = await t.session(f.familyId, 'member', 'Ông B');
    await linkAccountToProfile(t, f.main, busy, second.id);
    const outsider = await t.session(await t.family(), 'member', 'Người ngoài');
    const before = await snapshotHealthTables(t.owner);

    const conflict = await transfer(busy.accountId);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error: { code: 'ERR_PROFILE_ALREADY_LINKED' } });
    expect((await transfer(member.accountId)).status).toBe(409);
    expect((await transfer(outsider.accountId)).status).toBe(404);
    expect((await transfer(randomUUID())).status).toBe(404);
    expect((await transfer(null, randomUUID())).status).toBe(404);
    const otherFamily = `/api/admin/families/${await t.family()}/profiles`;
    expect((await transfer(null, profile.id, otherFamily)).status).toBe(404);

    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    expect(await eventsOf(profile.id)).toEqual([]);
    expect((await t.call(admin, 'PUT', `${path}/${profile.id}/linked-account`, {})).status).toBe(422);
  });

  it('TC-564: admin chỉ đọc id, displayName, linkedAccount — so khóa JSON chính xác, không lẫn gia đình khác', async () => {
    const { f, profile, member, path } = await linkedSetup();
    const free = await f.create({ displayName: 'Bé An' });
    const other = await profileConsentFixture(t);
    await other.create({ displayName: 'Nhà khác' });

    const response = await t.call(admin, 'GET', path);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const items = (await response.json()) as Record<string, unknown>[];
    expect(items).toEqual([
      { id: profile.id, displayName: 'Mẹ', linkedAccount: { id: member.accountId, displayName: 'Bà M' } },
      { id: free.id, displayName: 'Bé An', linkedAccount: null },
    ]);
    for (const item of items)
      expect(Object.keys(item).sort()).toEqual(['displayName', 'id', 'linkedAccount']);
    expect(Object.keys(items[0]!.linkedAccount as object).sort()).toEqual(['displayName', 'id']);
  });
});
