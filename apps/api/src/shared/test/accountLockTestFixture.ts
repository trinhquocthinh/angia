import { randomUUID } from 'node:crypto';
import { seedAccount, seedSession, type SeededSession } from './seedAuthFixtures.js';
import { seedProfileRows } from './seedSelfScopeRows.js';
import type { startRegistrationTestApp } from './startRegistrationTestApp.js';

type TestApp = Awaited<ReturnType<typeof startRegistrationTestApp>>;
export const LOCK_REASON = 'Lý do riêng tư không được ghi nhật ký';
export const LOCK_PASSWORD = 'StrongPassword123';
export const accountDetailKeys = ['displayName', 'familyName', 'id', 'lockedAt', 'username'];

export function callAccountLock(
  t: TestApp,
  user: SeededSession | null,
  id: string,
  action = '',
  body: unknown = { reason: LOCK_REASON },
) {
  return t.app.request(`/api/admin/accounts/${id}${action ? '/' + action : ''}`, {
    method: action ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      ...(user ? { cookie: user.cookie, 'x-csrf-token': user.csrf } : {}),
    },
    ...(action ? { body: JSON.stringify(body) } : {}),
  });
}

export async function seedAccountLockCase(t: TestApp) {
  const familyId = randomUUID();
  const profileId = randomUUID();
  const username = `lock.${randomUUID().slice(0, 8)}`;
  await t.owner.query('INSERT INTO families(id,name) VALUES($1,$2)', [familyId, 'Nhà thử']);
  const accountId = await seedAccount(t.owner, { familyId, familyRole: 'member' });
  await t.owner.query('UPDATE accounts SET username_normalized=$2,oidc_subject=NULL WHERE id=$1', [
    accountId,
    username,
  ]);
  await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
    accountId,
    await t.account.hasher.hash(LOCK_PASSWORD),
  ]);
  await t.owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Hồ sơ thử')", [
    profileId,
    familyId,
  ]);
  await t.owner.query('UPDATE accounts SET health_profile_id=$2 WHERE id=$1', [accountId, profileId]);
  await seedProfileRows(t.owner, familyId, profileId);
  await t.owner.query(
    "INSERT INTO push_subscriptions(id,family_id,account_id,endpoint_hash,endpoint,p256dh,auth,authorized_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,'key','auth',now())",
    [familyId, accountId, randomUUID(), `https://push.example/${randomUUID()}`],
  );
  const target = await seedSession(t.owner, accountId);
  await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [target.id]);
  const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
  return { familyId, profileId, username, target, admin };
}

export function loginAccountLockCase(t: TestApp, username: string) {
  return t.app.request('/api/auth/password-login', {
    method: 'POST',
    headers: {
      origin: 'https://angia.example',
      'content-type': 'application/json',
      'x-test-ip': randomUUID(),
    },
    body: JSON.stringify({ identifier: username, password: LOCK_PASSWORD }),
  });
}

export async function accountLockSnapshot(t: TestApp, accountId: string) {
  const account = (
    await t.owner.query('SELECT family_id,family_role,health_profile_id FROM accounts WHERE id=$1', [
      accountId,
    ])
  ).rows;
  const profile = (
    await t.owner.query('SELECT * FROM health_profiles WHERE id=$1', [account[0]?.health_profile_id])
  ).rows;
  const measurements = (
    await t.owner.query('SELECT * FROM measurements WHERE health_profile_id=$1 ORDER BY id', [
      account[0]?.health_profile_id,
    ])
  ).rows;
  return { account, profile, measurements };
}

export async function accountLockAudits(t: TestApp, accountId: string) {
  return (
    await t.owner.query(
      'SELECT actor_account_id,action,target_account_id,family_id,metadata FROM admin_audit_events WHERE target_account_id=$1 ORDER BY occurred_at,id',
      [accountId],
    )
  ).rows;
}
