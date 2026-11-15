import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { syncIdpSessions } from '../application/syncIdpSessions.js';
import { IdpDirectoryError } from '../application/IdpDirectoryError.js';
import { createAccountSessionStore } from './createAccountSessionStore.js';
let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
const now = new Date('2026-10-21T08:00:00Z');
const policy = {
  accessGroupName: 'access',
  adminGroupName: 'admins',
  maxRevokes: 10,
  dryRun: false,
  now: () => now,
};
beforeAll(async () => {
  fx = await createSanitizePgFixture();
});
afterAll(async () => {
  await fx?.close();
});
beforeEach(async () => {
  await fx.owner.query('DELETE FROM push_subscriptions');
  await fx.owner.query('DELETE FROM sessions');
});
async function account() {
  const { familyId } = await fx.seed();
  return (
    await fx.owner.query('SELECT id,oidc_subject,family_id FROM accounts WHERE family_id=$1', [familyId])
  ).rows[0] as { id: string; oidc_subject: string; family_id: string };
}
async function push(a: Awaited<ReturnType<typeof account>>, authorizedAt = new Date(now.getTime() - 60000)) {
  const id = randomUUID();
  await fx.owner.query(
    `INSERT INTO push_subscriptions(id,family_id,account_id,authorized_at,endpoint,endpoint_hash,p256dh,auth)
    VALUES($1::uuid,$2,$3,$4,$5,$1::text,'key','auth')`,
    [id, a.family_id, a.id, authorizedAt, `https://web.push.apple.com/${id}`],
  );
  return id;
}
const directory = (subject: string) => ({
  fetchGroupMembers: async (name: string) => (name === 'access' ? [{ uid: subject, isActive: true }] : []),
});
const remaining = async (id: string) =>
  (await fx.owner.query('SELECT id FROM push_subscriptions WHERE account_id=$1 ORDER BY authorized_at', [id]))
    .rows;
describe('IdP thu hồi thiết bị không còn phiên', () => {
  it('TC-357: mất quyền thu hồi push qua RLS dù không có phiên', async () => {
    const [blocked, keeper] = [await account(), await account()];
    await push(blocked);
    const store = createAccountSessionStore(fx.pool);
    expect((await store.listAccounts(now)).find((a) => a.id === blocked.id)).toMatchObject({
      hasSession: false,
      hasPush: true,
    });
    expect(
      (await syncIdpSessions({ store, directory: directory(keeper.oidc_subject) }, policy)).revoke,
    ).toEqual([blocked.id]);
    expect(await remaining(blocked.id)).toEqual([]);
    expect((await fx.pool.query('SELECT * FROM push_subscriptions')).rows).toEqual([]);
    expect(
      (await fx.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });
  it('TC-358: dry-run, lỗi IdP và trần thu hồi không xóa thiết bị', async () => {
    const [blocked, keeper] = [await account(), await account()];
    const id = await push(blocked);
    const deps = { store: createAccountSessionStore(fx.pool), directory: directory(keeper.oidc_subject) };
    await syncIdpSessions(deps, { ...policy, dryRun: true });
    expect(await remaining(blocked.id)).toEqual([{ id }]);
    await syncIdpSessions(deps, { ...policy, maxRevokes: 0 });
    expect(await remaining(blocked.id)).toEqual([{ id }]);
    await syncIdpSessions(
      {
        ...deps,
        directory: {
          fetchGroupMembers: async () => {
            throw new IdpDirectoryError('idp_unreachable');
          },
        },
      },
      policy,
    );
    expect(await remaining(blocked.id)).toEqual([{ id }]);
  });
  it('TC-359: snapshot cũ chỉ xóa binding xác thực trước snapshot', async () => {
    const [blocked, keeper] = [await account(), await account()];
    await push(blocked);
    const fresh = await push(blocked, new Date(now.getTime() + 60000));
    await syncIdpSessions(
      { store: createAccountSessionStore(fx.pool), directory: directory(keeper.oidc_subject) },
      policy,
    );
    expect(await remaining(blocked.id)).toEqual([{ id: fresh }]);
  });
});

it('TC-898: local-only không bị đồng bộ admin hoặc thu hồi phiên/Push không còn session', async () => {
  const [local, keeper] = [await account(), await account()];
  await fx.owner.query('UPDATE accounts SET oidc_subject=NULL,is_system_admin=true WHERE id=$1', [local.id]);
  const id = await push(local);
  await fx.owner.query("UPDATE push_subscriptions SET auth_method='local' WHERE id=$1", [id]);
  await fx.owner.query(
    `INSERT INTO sessions(id,account_id,csrf_token,expires_at,auth_method,created_at)
    VALUES(gen_random_uuid(),$1,'csrf',$2,'local',$3)`,
    [local.id, new Date(now.getTime() + 60000), new Date(now.getTime() - 60000)],
  );
  const store = createAccountSessionStore(fx.pool);
  expect((await store.listAccounts(now)).find((a) => a.id === local.id)).toBeUndefined();
  await syncIdpSessions({ store, directory: directory(keeper.oidc_subject) }, policy);
  expect(await remaining(local.id)).toEqual([{ id }]);
  expect((await fx.owner.query('SELECT 1 FROM sessions WHERE account_id=$1', [local.id])).rowCount).toBe(1);
  expect(
    (await fx.owner.query('SELECT is_system_admin FROM accounts WHERE id=$1', [local.id])).rows[0]
      .is_system_admin,
  ).toBe(true);
});

it('TC-899: hai nguồn chỉ thu hồi OIDC, giữ local và Push nguồn độc lập session', async () => {
  const [mixed, keeper] = [await account(), await account()];
  await fx.owner.query('UPDATE accounts SET is_system_admin=true WHERE id=$1', [mixed.id]);
  const localPush = await push(mixed);
  await fx.owner.query("UPDATE push_subscriptions SET auth_method='local' WHERE id=$1", [localPush]);
  await push(mixed);
  for (const source of ['local', 'oidc'])
    await fx.owner.query(
      `INSERT INTO sessions
    (id,account_id,csrf_token,expires_at,auth_method,created_at) VALUES(gen_random_uuid(),$1,'csrf',$2,$3,$4)`,
      [mixed.id, new Date(now.getTime() + 60000), source, new Date(now.getTime() - 60000)],
    );
  const store = createAccountSessionStore(fx.pool);
  await syncIdpSessions({ store, directory: directory(keeper.oidc_subject) }, policy);
  expect(await remaining(mixed.id)).toEqual([{ id: localPush }]);
  expect(
    (await fx.owner.query('SELECT auth_method FROM sessions WHERE account_id=$1', [mixed.id])).rows,
  ).toEqual([{ auth_method: 'local' }]);
  expect(
    (await fx.owner.query('SELECT is_system_admin FROM accounts WHERE id=$1', [mixed.id])).rows[0]
      .is_system_admin,
  ).toBe(false);
  expect((await store.listAccounts(now)).find((a) => a.id === mixed.id)).toMatchObject({
    hasSession: false,
    hasPush: false,
  });
});

it('TC-899: lỗi đồng bộ admin rollback cả phiên và Push đã thu hồi', async () => {
  const mixed = await account();
  await fx.owner.query('UPDATE accounts SET is_system_admin=true WHERE id=$1', [mixed.id]);
  for (const method of ['local', 'oidc']) {
    const id = await push(mixed);
    await fx.owner.query('UPDATE push_subscriptions SET auth_method=$1 WHERE id=$2', [method, id]);
    await fx.owner.query(
      `INSERT INTO sessions(id,account_id,csrf_token,expires_at,auth_method,created_at)
      VALUES(gen_random_uuid(),$1,'csrf',$2,$3,$4)`,
      [mixed.id, new Date(now.getTime() + 60000), method, new Date(now.getTime() - 60000)],
    );
  }
  await fx.owner.query(`CREATE FUNCTION fail_idp_admin() RETURNS trigger LANGUAGE plpgsql AS
    $$ BEGIN RAISE EXCEPTION 'admin failure'; END $$;
    CREATE TRIGGER fail_idp_admin BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION fail_idp_admin()`);
  try {
    await expect(
      createAccountSessionStore(fx.pool).apply(
        { revoke: [mixed.id], adminOn: [], adminOff: [mixed.id] },
        now,
      ),
    ).rejects.toThrow('admin failure');
    expect((await remaining(mixed.id)).length).toBe(2);
    expect(
      (
        await fx.owner.query('SELECT auth_method FROM sessions WHERE account_id=$1 ORDER BY auth_method', [
          mixed.id,
        ])
      ).rows,
    ).toEqual([{ auth_method: 'local' }, { auth_method: 'oidc' }]);
    expect(
      (await fx.owner.query('SELECT is_system_admin FROM accounts WHERE id=$1', [mixed.id])).rows[0]
        .is_system_admin,
    ).toBe(true);
  } finally {
    await fx.owner.query('DROP TRIGGER fail_idp_admin ON accounts; DROP FUNCTION fail_idp_admin()');
  }
});
