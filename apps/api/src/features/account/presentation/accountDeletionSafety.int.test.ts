import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  accountDeletionFixture,
  accountDeletionSnapshot,
  DELETION_PASSWORD,
  DELETION_PATH,
  expectAccountTombstone,
  requestAccountDeletion,
  seedDeletionCredential,
} from '@src/shared/test/accountDeletionFixtures.js';
import { seedMembershipProfile } from '@src/shared/test/seedMembershipProfile.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { createAccountDeletions } from '../infrastructure/createAccountDeletions.js';

describe('SPEC-073: ràng buộc và hàm dọn tài khoản an toàn', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-827: hàm definer xoá cửa sổ và người nhận nhắc thuộc nhà cũ', async () => {
    const f = await accountDeletionFixture(t);
    await t.owner.query("UPDATE accounts SET family_role='main' WHERE id=$1", [f.member.accountId]);
    const oldFamily = await t.family();
    const oldOwner = await t.session(oldFamily);
    const oldProfile = await seedMembershipProfile(t, oldFamily, oldOwner.accountId);
    await t.owner.query(
      "INSERT INTO removed_member_windows(account_id,family_id,removed_at,expires_at) VALUES($1,$2,now(),now()+interval '168 hours')",
      [f.member.accountId, oldFamily],
    );
    await t.owner.query(
      'INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [oldProfile, oldFamily, f.member.accountId],
    );
    // Nhà cũ là tài nguyên khác nhà hiện tại, không lộ sự tồn tại trước khi xoá.
    await expectCrossFamilyDenied(
      () => t.call(f.member, 'GET', `/api/health-profiles/${oldProfile}/measurements`),
      () => t.call(f.member, 'GET', `/api/health-profiles/${randomUUID()}/measurements`),
    );
    expect((await requestAccountDeletion(t, f.member)).status).toBe(204);
    await expectAccountTombstone(t, f.member.accountId);
    expect((await t.call(f.member, 'GET', `/api/health-profiles/${oldProfile}/measurements`)).status).toBe(
      401,
    );
  });

  it('TC-827: role app không thể dọn account chưa xoá, dữ liệu vẫn nguyên', async () => {
    const f = await accountDeletionFixture(t);
    const oldFamily = await t.family();
    await t.owner.query(
      "INSERT INTO removed_member_windows(account_id,family_id,removed_at,expires_at) VALUES($1,$2,now(),now()+interval '168 hours')",
      [f.member.accountId, oldFamily],
    );
    await t.owner.query(
      'INSERT INTO reminder_recipients(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [f.profile, f.family, f.member.accountId],
    );
    const before = await accountDeletionSnapshot(t, f.member.accountId);
    await expect(
      t.pool.query('SELECT public.purge_deleted_account_rows($1::uuid)', [f.member.accountId]),
    ).rejects.toThrow();
    expect(await accountDeletionSnapshot(t, f.member.accountId)).toEqual(before);
    expect(
      (await t.owner.query('SELECT 1 FROM removed_member_windows WHERE account_id=$1', [f.member.accountId]))
        .rowCount,
    ).toBe(1);
    expect(
      (await t.owner.query('SELECT 1 FROM reminder_recipients WHERE account_id=$1', [f.member.accountId]))
        .rowCount,
    ).toBe(1);
  });

  it('TC-829: người giám hộ duy nhất bị chặn, details liệt kê hồ sơ trẻ', async () => {
    const f = await accountDeletionFixture(t);
    await t.owner.query("UPDATE accounts SET family_role='main' WHERE id=$1", [f.member.accountId]);
    const child = await seedMembershipProfile(t, f.family, f.owner.accountId, new Date().getFullYear() - 5);
    await t.owner.query(
      'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [child, f.family, f.member.accountId],
    );
    const before = await accountDeletionSnapshot(t, f.member.accountId);
    const response = await requestAccountDeletion(t, f.member);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_LAST_GUARDIAN', details: { profileIds: [child] } },
    });
    expect(await accountDeletionSnapshot(t, f.member.accountId)).toEqual(before);
  });

  it('TC-827: liên kết hồ sơ thiếu disposition trả 422 và không xoá gì', async () => {
    const f = await accountDeletionFixture(t);
    const before = await accountDeletionSnapshot(t, f.member.accountId);
    const response = await requestAccountDeletion(t, f.member, { password: DELETION_PASSWORD });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    expect(await accountDeletionSnapshot(t, f.member.accountId)).toEqual(before);
  });

  it('TC-830: mật khẩu đổi giữa lúc xác nhận và xoá → rollback cả phần rời nhà', async () => {
    const f = await accountDeletionFixture(t);
    const before = await accountDeletionSnapshot(t, f.member.accountId);
    const result = await createAccountDeletions(t.database, t.boss).deleteAccount({
      accountId: f.member.accountId,
      expectedCredentialVersion: 999,
      usernameHash: 'stale',
      ownProfileDisposition: 'delete',
    });
    expect(result).toEqual({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
    expect(await accountDeletionSnapshot(t, f.member.accountId)).toEqual(before);
    expect((await t.owner.query('SELECT 1 FROM health_profiles WHERE id=$1', [f.profile])).rowCount).toBe(1);
  });

  it('TC-830: tài khoản chỉ OIDC không có credential local trả 401', async () => {
    const family = await t.family();
    const user = await t.session(family, 'member');
    const before = await accountDeletionSnapshot(t, user.accountId);
    const response = await requestAccountDeletion(t, user);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INVALID_CREDENTIALS' } });
    expect(await accountDeletionSnapshot(t, user.accountId)).toEqual(before);
  });

  it('TC-829: Chủ hộ một mình cần xoá nhà trước', async () => {
    const family = await t.family();
    const user = await t.session(family);
    await seedDeletionCredential(t, user);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [user.accountId, family]);
    const response = await requestAccountDeletion(t, user);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_OWNER_MUST_DELETE_FAMILY' } });
  });

  it('TC-827: body thừa ID nhà khác hoặc JSON hỏng trả 422, phiên thiếu trả 401', async () => {
    const f = await accountDeletionFixture(t);
    expect(
      (await requestAccountDeletion(t, f.member, { password: DELETION_PASSWORD, familyId: randomUUID() }))
        .status,
    ).toBe(422);
    expect(
      (
        await t.app.request(DELETION_PATH, {
          method: 'POST',
          headers: {
            cookie: f.member.cookie,
            'x-csrf-token': f.member.csrf,
            origin: 'https://angia.test',
            'content-type': 'application/json',
          },
          body: '{',
        })
      ).status,
    ).toBe(422);
    expect((await t.app.request(DELETION_PATH, { method: 'POST' })).status).toBe(401);
    expect(
      (await t.owner.query('SELECT deleted_at FROM accounts WHERE id=$1', [f.member.accountId])).rows[0]
        .deleted_at,
    ).toBeNull();
  });
});
