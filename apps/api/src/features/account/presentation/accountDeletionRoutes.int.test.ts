import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  accountDeletionFixture,
  accountDeletionSnapshot,
  DELETION_PASSWORD,
  expectAccountTombstone,
  requestAccountDeletion,
  seedDeletionCredential,
  seedUnhousedDeletionAccount,
} from '@src/shared/test/accountDeletionFixtures.js';
import { createLocalIdentityProvider } from '@src/shared/identity/infrastructure/createLocalIdentityProvider.js';
import { createCredentialRepository } from '@src/shared/identity/infrastructure/createCredentialRepository.js';
import { createArgon2PasswordHasher } from '@src/shared/identity/infrastructure/createArgon2PasswordHasher.js';
import { createAccountRegistrationUnitOfWork } from '../infrastructure/createAccountRegistrationUnitOfWork.js';
import { createUsernameHasher } from '../infrastructure/createUsernameHasher.js';

const hashUsername = createUsernameHasher('test-username-secret'.repeat(3));
describe('SPEC-073: xoá tài khoản qua HTTP và PostgreSQL', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-827: xoá hồ sơ và object, giữ đồng ý pháp lý, ẩn danh và thu hồi mọi dữ liệu tài khoản', async () => {
    const f = await accountDeletionFixture(t);
    const legalRef = (await t.owner.query('SELECT legal_ref FROM accounts WHERE id=$1', [f.member.accountId]))
      .rows[0].legal_ref;
    const legalBefore = (
      await t.owner.query('SELECT * FROM legal_acceptances WHERE account_ref=$1 ORDER BY id', [legalRef])
    ).rows;
    await t.owner.query('INSERT INTO data_exports(id,account_id) VALUES(gen_random_uuid(),$1)', [
      f.member.accountId,
    ]);
    await t.owner.query(
      "INSERT INTO push_subscriptions(id,family_id,account_id,endpoint_hash,endpoint,p256dh,auth,authorized_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,'key','auth',now())",
      [f.family, f.member.accountId, randomUUID(), `https://push.example/${randomUUID()}`],
    );
    const response = await requestAccountDeletion(t, f.member, {
      password: DELETION_PASSWORD,
      ownProfileDisposition: 'delete',
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('angia_session=;');
    await expectAccountTombstone(t, f.member.accountId);
    expect((await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [f.profile])).rowCount).toBe(0);
    expect(t.objects.has(f.key)).toBe(false);
    expect(
      (
        await t.owner.query(
          "SELECT data FROM pgboss.job WHERE name='purge-profile-objects' AND data->>'profileId'=$1",
          [f.profile],
        )
      ).rows,
    ).toEqual([{ data: { familyId: f.family, profileId: f.profile } }]);
    expect(
      (await t.owner.query('SELECT * FROM legal_acceptances WHERE account_ref=$1 ORDER BY id', [legalRef]))
        .rows,
    ).toEqual(legalBefore);
    expect(
      (await t.owner.query('SELECT legal_ref FROM accounts WHERE id=$1', [f.member.accountId])).rows[0]
        .legal_ref,
    ).toBe(legalRef);
    expect(
      (
        await t.owner.query('SELECT username_hash FROM deleted_usernames WHERE username_hash=$1', [
          hashUsername(f.username),
        ])
      ).rowCount,
    ).toBe(1);
    const audits = (
      await t.owner.query(
        'SELECT action,metadata,target_account_id FROM admin_audit_events WHERE actor_account_id=$1 ORDER BY occurred_at,id',
        [f.member.accountId],
      )
    ).rows;
    expect(audits).toEqual([
      { action: 'member_left', metadata: {}, target_account_id: f.member.accountId },
      { action: 'account_deleted', metadata: {}, target_account_id: f.member.accountId },
    ]);
    const identity = await createLocalIdentityProvider(
      createCredentialRepository(t.database),
      createArgon2PasswordHasher(),
    );
    expect(await identity.verifyPassword(f.username, DELETION_PASSWORD)).toBeNull();
    expect((await t.app.request('/api/me', { headers: { cookie: f.member.cookie } })).status).toBe(401);
  });

  it('TC-828: giữ hồ sơ confirmed trong nhà và gỡ mọi liên kết tài khoản', async () => {
    const f = await accountDeletionFixture(t);
    expect((await requestAccountDeletion(t, f.member)).status).toBe(204);
    expect(
      (await t.owner.query('SELECT family_id,consent_status FROM health_profiles WHERE id=$1', [f.profile]))
        .rows,
    ).toEqual([{ family_id: f.family, consent_status: 'confirmed' }]);
    expect(
      (await t.owner.query('SELECT id FROM accounts WHERE health_profile_id=$1', [f.profile])).rowCount,
    ).toBe(0);
    expect(t.objects.has(f.key)).toBe(true);
    await expectAccountTombstone(t, f.member.accountId);
  });

  it('TC-829: Chủ hộ còn người khác phải trao quyền, toàn bộ thao tác rollback', async () => {
    const f = await accountDeletionFixture(t);
    await seedDeletionCredential(t, f.owner);
    const before = await accountDeletionSnapshot(t, f.owner.accountId);
    const response = await requestAccountDeletion(t, f.owner);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_OWNER_MUST_TRANSFER' } });
    expect(await accountDeletionSnapshot(t, f.owner.accountId)).toEqual(before);
  });

  it('TC-830: mật khẩu sai không xoá dữ liệu, credential và phiên còn nguyên', async () => {
    const f = await accountDeletionFixture(t);
    const before = await accountDeletionSnapshot(t, f.member.accountId);
    const response = await requestAccountDeletion(t, f.member, { password: 'SaiMatKhau' });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INVALID_CREDENTIALS' } });
    expect(await accountDeletionSnapshot(t, f.member.accountId)).toEqual(before);
  });

  it('TC-831: chưa có nhà, chưa đồng ý pháp lý vẫn xoá ngay', async () => {
    const { user } = await seedUnhousedDeletionAccount(t);
    expect((await requestAccountDeletion(t, user, { password: DELETION_PASSWORD })).status).toBe(204);
    await expectAccountTombstone(t, user.accountId);
  });

  it('TC-831: đăng ký lại username vừa xoá trả cùng lỗi tên đã được dùng', async () => {
    const f = await accountDeletionFixture(t);
    expect((await requestAccountDeletion(t, f.member)).status).toBe(204);
    const versions = (
      await t.owner.query('SELECT id,kind FROM legal_document_versions WHERE version=$1', ['1.0.0'])
    ).rows;
    const result = await createAccountRegistrationUnitOfWork(t.database, hashUsername).register({
      usernameNormalized: f.username,
      passwordHash: f.passwordHash,
      displayName: 'Người mới',
      email: null,
      legalAcceptance: {
        termsVersionId: versions.find((v) => v.kind === 'terms').id,
        privacyVersionId: versions.find((v) => v.kind === 'privacy').id,
      },
    });
    expect(result).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
    expect(
      (await t.owner.query('SELECT id FROM accounts WHERE username_normalized=$1', [f.username])).rowCount,
    ).toBe(0);
  });

  it('TC-827: lỗi storage sau COMMIT vẫn thành công và giữ job vét object', async () => {
    const f = await accountDeletionFixture(t);
    t.failNextDeletePrefix();
    expect(
      (
        await requestAccountDeletion(t, f.member, {
          password: DELETION_PASSWORD,
          ownProfileDisposition: 'delete',
        })
      ).status,
    ).toBe(204);
    await expectAccountTombstone(t, f.member.accountId);
    expect(t.objects.has(f.key)).toBe(true);
    expect(
      (
        await t.owner.query(
          "SELECT id FROM pgboss.job WHERE name='purge-profile-objects' AND data->>'profileId'=$1",
          [f.profile],
        )
      ).rowCount,
    ).toBe(1);
  });
});
