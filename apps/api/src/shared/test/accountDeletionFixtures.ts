import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import type { ProfileTestApp } from './startProfileTestApp.js';
import { seedAccount, seedSession, type SeededSession } from './seedAuthFixtures.js';
import { seedMembershipProfile } from './seedMembershipProfile.js';
import { createArgon2PasswordHasher } from '@src/shared/identity/infrastructure/createArgon2PasswordHasher.js';

export const DELETION_PASSWORD = 'AccountPassword123';
const DELETION_ORIGIN = 'https://angia.test';
export const DELETION_PATH = '/api/me/account-deletion';

export async function seedDeletionCredential(t: ProfileTestApp, user: SeededSession) {
  const username = randomUUID().replaceAll('-', '').slice(0, 20);
  const passwordHash = await createArgon2PasswordHasher().hash(DELETION_PASSWORD);
  await t.owner.query('UPDATE accounts SET username_normalized=$1,email=$2 WHERE id=$3', [
    username,
    `${username}@example.test`,
    user.accountId,
  ]);
  await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
    user.accountId,
    passwordHash,
  ]);
  return { username, passwordHash };
}

export async function accountDeletionFixture(t: ProfileTestApp) {
  const family = await t.family();
  const owner = await t.session(family);
  const member = await t.session(family, 'member');
  await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
  const credential = await seedDeletionCredential(t, member);
  const profile = await seedMembershipProfile(t, family, owner.accountId);
  await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, member.accountId]);
  const key = `families/${family}/profiles/${profile}/documents/test/upload.jpg`;
  t.objects.set(key, { body: new Uint8Array([1]), contentType: 'image/jpeg' });
  return { family, owner, member, profile, key, ...credential };
}

export function requestAccountDeletion(
  t: ProfileTestApp,
  user: SeededSession,
  body: object = { password: DELETION_PASSWORD, ownProfileDisposition: 'keep' },
) {
  return t.app.request(DELETION_PATH, {
    method: 'POST',
    headers: {
      cookie: user.cookie,
      'x-csrf-token': user.csrf,
      origin: DELETION_ORIGIN,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function accountDeletionSnapshot(t: ProfileTestApp, accountId: string) {
  return {
    account: (await t.owner.query('SELECT * FROM accounts WHERE id=$1', [accountId])).rows,
    credentials: (await t.owner.query('SELECT * FROM account_credentials WHERE account_id=$1', [accountId]))
      .rows,
    // loadSession gia hạn expires_at; không lấy trường đó khi kiểm không thay đổi nghiệp vụ.
    sessions: (
      await t.owner.query('SELECT id,account_id,csrf_token FROM sessions WHERE account_id=$1 ORDER BY id', [
        accountId,
      ])
    ).rows,
    audits: (
      await t.owner.query('SELECT action FROM admin_audit_events WHERE actor_account_id=$1', [accountId])
    ).rows,
  };
}

export async function expectAccountTombstone(t: ProfileTestApp, accountId: string) {
  const row = (await t.owner.query('SELECT * FROM accounts WHERE id=$1', [accountId])).rows[0];
  expect(row).toMatchObject({
    display_name: '',
    username_normalized: null,
    email: null,
    pending_email: null,
    oidc_subject: null,
    family_id: null,
    family_role: null,
    health_profile_id: null,
    is_system_admin: false,
    must_change_password: false,
    deleted_at: expect.any(Date),
  });
  for (const table of [
    'sessions',
    'account_credentials',
    'push_subscriptions',
    'data_exports',
    'removed_member_windows',
    'reminder_recipients',
  ]) {
    expect(
      (await t.owner.query(`SELECT 1 FROM ${table} WHERE account_id=$1`, [accountId])).rowCount,
      table,
    ).toBe(0);
  }
}

export async function seedUnhousedDeletionAccount(t: ProfileTestApp) {
  const user = await seedSession(t.owner, await seedAccount(t.owner, { legalAccepted: false }));
  return { user, ...(await seedDeletionCredential(t, user)) };
}
