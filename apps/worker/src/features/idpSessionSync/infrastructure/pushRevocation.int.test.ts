import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { syncIdpSessions } from '../application/syncIdpSessions.js';
import { IdpDirectoryError } from '../application/IdpDirectoryError.js';
import { createAccountSessionStore } from './createAccountSessionStore.js';
let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
const now = new Date('2026-10-21T08:00:00Z');
const policy = {
  accessGroupName: 'access',
  adminGroupName: 'admins',
  maxRevokes: 10,
  dryRun: false,
  now: () => now,
};
beforeAll(async () => {
  fx = await createPrivacyPgFixture();
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
