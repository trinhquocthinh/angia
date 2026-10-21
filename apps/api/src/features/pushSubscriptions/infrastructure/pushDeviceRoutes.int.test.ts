import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedSession, type SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { createPushTestCaller } from '@src/shared/test/createPushTestCaller.js';
import { createPushSubscriptionRepository } from './createPushSubscriptionRepository.js';
let t: ProfileTestApp;
const call = createPushTestCaller(() => t);
const path = '/api/me/push-subscription';
const value = () => ({
  endpoint: `https://web.push.apple.com/${randomUUID()}`,
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
});
beforeAll(async () => {
  t = await startProfileTestApp('http://localhost:5173', {
    push: (db) => ({
      publicKey: 'public',
      repository: createPushSubscriptionRepository(db),
      now: () => new Date(),
      sender: { send: async () => 'accepted' },
    }),
  });
});
afterAll(async () => {
  await t?.stop();
});
const browser = (user: SeededSession, response: Response) => ({
  ...user,
  cookie:
    user.cookie +
    '; ' +
    response.headers
      .getSetCookie()
      .find((x) => x.startsWith('angia_push_device='))!
      .split(';')[0],
});
describe('Quản lý đúng thiết bị sau hết phiên', () => {
  it('TC-355: logout A thu hồi A, thiết bị B cùng account vẫn nhận', async () => {
    const a = await t.session(await t.family());
    const b = await seedSession(t.owner, a.accountId);
    await call(a, 'PUT', path, value());
    await call(b, 'PUT', path, value());
    expect((await call(a, 'POST', '/api/auth/logout')).status).toBe(204);
    expect((await call(b, 'POST', '/api/me/push-test')).status).toBe(204);
    expect(
      (
        await t.owner.query('SELECT last_session_id FROM push_subscriptions WHERE account_id=$1', [
          a.accountId,
        ])
      ).rows,
    ).toEqual([{ last_session_id: b.id }]);
  });
  it('TC-355b: cookie hiện tại chỉ thu hồi một thiết bị dù hai đích dùng chung phiên', async () => {
    const user = await t.session(await t.family());
    const first = await t.call(user, 'PUT', path, { ...value(), intent: 'enable' });
    const second = await t.call(user, 'PUT', path, { ...value(), intent: 'enable' });
    const otherId = (
      await t.owner.query(
        'SELECT id FROM push_subscriptions WHERE account_id=$1 ORDER BY created_at DESC LIMIT 1',
        [user.accountId],
      )
    ).rows[0].id;
    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect((await t.call(browser(user, first), 'POST', '/api/auth/logout')).status).toBe(204);
    expect(
      (
        await t.owner.query('SELECT id, last_session_id FROM push_subscriptions WHERE account_id=$1', [
          user.accountId,
        ])
      ).rows,
    ).toEqual([{ id: otherId, last_session_id: null }]);
  });
  it('TC-356: tắt rồi login lại không được sync hồi sinh đích cũ', async () => {
    const a = await t.session(await t.family());
    const sub = value();
    await call(a, 'PUT', path, sub);
    await call(a, 'DELETE', path);
    const fresh = await seedSession(t.owner, a.accountId);
    expect((await call(fresh, 'PUT', path, { ...sub, intent: 'sync' })).status).toBe(409);
    expect((await call(fresh, 'PUT', path, { ...sub, intent: 'enable' })).status).toBe(204);
    expect((await t.call(fresh, 'PUT', path, sub)).status).toBe(422);
  });
  it('TC-361: cookie thiết bị không thay phiên/CSRF và không quản lý account khác', async () => {
    const a = await t.session(await t.family());
    const b = await t.session(await t.family());
    const enabled = await call(a, 'PUT', path, value());
    const cookie = browser(a, enabled).cookie.split('; ').slice(1).join('; ');
    expect((await t.app.request('/api/me/push-config', { headers: { cookie } })).status).toBe(401);
    const impostor = { ...b, cookie: b.cookie + '; ' + cookie };
    expect(await (await t.call(impostor, 'GET', '/api/me/push-config')).json()).toMatchObject({
      registered: false,
    });
    await t.call(impostor, 'DELETE', path);
    expect((await call(a, 'POST', '/api/me/push-test')).status).toBe(204);
    expect(
      (await t.app.request(path, { method: 'DELETE', headers: { cookie: browser(a, enabled).cookie } }))
        .status,
    ).toBe(403);
  });
  it('TC-359: sync bằng phiên cũ không đẩy mốc xác thực, login mới mới đổi mốc', async () => {
    const a = await t.session(await t.family());
    const sub = value();
    await t.owner.query("UPDATE sessions SET created_at=now()-interval '2 days' WHERE id=$1", [a.id]);
    const enabled = await call(a, 'PUT', path, sub);
    const authAt = (
      await t.owner.query('SELECT authorized_at FROM push_subscriptions WHERE account_id=$1', [a.accountId])
    ).rows[0].authorized_at;
    await call(a, 'PUT', path, { ...sub, intent: 'sync' });
    expect(
      (await t.owner.query('SELECT authorized_at FROM push_subscriptions WHERE account_id=$1', [a.accountId]))
        .rows[0].authorized_at,
    ).toEqual(authAt);
    const fresh = await seedSession(t.owner, a.accountId);
    expect((await t.call(browser(fresh, enabled), 'PUT', path, { ...sub, intent: 'sync' })).status).toBe(204);
    expect(
      (
        await t.owner.query('SELECT authorized_at FROM push_subscriptions WHERE account_id=$1', [a.accountId])
      ).rows[0].authorized_at.getTime(),
    ).toBeGreaterThan(authAt.getTime());
  });
});
