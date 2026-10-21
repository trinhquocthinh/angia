import { createFamilyAdminRepository } from '@src/features/family/infrastructure/createFamilyAdminRepository.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { createPushSubscriptionRepository } from './createPushSubscriptionRepository.js';
import type { PushDependencies } from '../application/ports.js';
import { sql } from 'drizzle-orm';
const subscription = (id: string) => ({
  endpoint: `https://web.push.apple.com/${id}`,
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
});
let test: ProfileTestApp;
let deps: PushDependencies;
const sent: string[] = [];
beforeAll(async () => {
  test = await startProfileTestApp('http://localhost:5173', {
    push: (db) => {
      deps = {
        publicKey: 'B'.repeat(87),
        now: () => new Date(),
        repository: createPushSubscriptionRepository(db),
        sender: {
          send: async (value) => {
            sent.push(value.endpoint);
            return 'accepted';
          },
        },
      };
      return deps;
    },
  });
});
afterAll(async () => {
  await test?.stop();
});
describe('SPEC-034 — đăng ký Web Push với PostgreSQL role app', () => {
  it('TC-338: thiếu phiên, sai CSRF và chưa có family bị chặn', async () => {
    expect((await test.app.request('/api/me/push-config')).status).toBe(401);
    const user = await test.session(await test.family());
    expect(
      (await test.app.request('/api/me/push-test', { method: 'POST', headers: { cookie: user.cookie } }))
        .status,
    ).toBe(403);
    const pending = await seedSession(test.owner, await seedAccount(test.owner));
    expect((await test.call(pending, 'GET', '/api/me/push-config')).status).toBe(403);
  });
  it('TC-339: không gửi/gỡ đăng ký của family hoặc tài khoản/phiên khác', async () => {
    const f = await test.family();
    const a = await test.session(f, 'member');
    const b = await test.session(f);
    const other = await test.session(await test.family());
    expect((await test.call(a, 'PUT', '/api/me/push-subscription', subscription(a.id))).status).toBe(204);
    for (const user of [b, other]) {
      const config = await test.call(user, 'GET', '/api/me/push-config');
      expect(((await config.json()) as { registered: boolean }).registered).toBe(false);
      expect((await test.call(user, 'POST', '/api/me/push-test')).status).toBe(409);
      expect((await test.call(user, 'DELETE', '/api/me/push-subscription')).status).toBe(204);
    }
    expect((await test.call(a, 'POST', '/api/me/push-test')).status).toBe(204);
    expect(sent).toContain(subscription(a.id).endpoint);
    const unscoped = await test.database.execute(sql`SELECT * FROM push_subscriptions`);
    expect(unscoped.rows).toHaveLength(0);
  });
  it('TC-340: upsert không trùng; khác chủ không chiếm endpoint kể cả ngoài RLS', async () => {
    const a = await test.session(await test.family());
    const b = await test.session(await test.family());
    const value = subscription(a.id);
    expect((await test.call(a, 'PUT', '/api/me/push-subscription', value)).status).toBe(204);
    expect((await test.call(a, 'PUT', '/api/me/push-subscription', value)).status).toBe(204);
    expect((await test.call(b, 'PUT', '/api/me/push-subscription', value)).status).toBe(409);
    expect(
      Number(
        (await test.owner.query('SELECT count(*) FROM push_subscriptions WHERE session_id=$1', [a.id]))
          .rows[0].count,
      ),
    ).toBe(1);
    expect(
      (await test.call(a, 'PUT', '/api/me/push-subscription', { ...value, familyId: b.id })).status,
    ).toBe(422);
  });
  it('TC-340: trần10 đăng ký vẫn đúng khi đăng ký đồng thời', async () => {
    const f = await test.family();
    const first = await test.session(f);
    const users = [first];
    for (let i = 0; i < 10; i++) users.push(await seedSession(test.owner, first.accountId));
    const results = await Promise.all(
      users.map((u) => test.call(u, 'PUT', '/api/me/push-subscription', subscription(u.id))),
    );
    expect(results.filter((res) => res.status === 204)).toHaveLength(10);
    expect(results.filter((res) => res.status === 409)).toHaveLength(1);
  });
  it('TC-341: lần gửi thử thứ4 bị429 và có Retry-After', async () => {
    const a = await test.session(await test.family());
    await test.call(a, 'PUT', '/api/me/push-subscription', subscription(a.id));
    for (let i = 0; i < 3; i++) expect((await test.call(a, 'POST', '/api/me/push-test')).status).toBe(204);
    const limited = await test.call(a, 'POST', '/api/me/push-test');
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
  });
  it('TC-342: logout cascade; hết hạn không gửi, member tự quản lý được', async () => {
    const a = await test.session(await test.family(), 'member');
    await test.call(a, 'PUT', '/api/me/push-subscription', subscription(a.id));
    expect((await test.call(a, 'POST', '/api/auth/logout')).status).toBe(204);
    expect(
      (await test.owner.query('SELECT id FROM push_subscriptions WHERE session_id=$1', [a.id])).rows,
    ).toHaveLength(0);
    expect((await test.call(a, 'POST', '/api/me/push-test')).status).toBe(401);
    const b = await test.session(await test.family());
    await test.call(b, 'PUT', '/api/me/push-subscription', subscription(b.id));
    await test.owner.query("UPDATE sessions SET expires_at=now()-interval '1 day' WHERE id=$1", [b.id]);
    expect(
      await deps.repository.read(
        {
          familyId: (await test.owner.query('SELECT family_id FROM accounts WHERE id=$1', [b.accountId]))
            .rows[0].family_id,
          accountId: b.accountId,
          sessionId: b.id,
        },
        new Date(),
      ),
    ).toBeNull();
  });
  it('TC-342: gỡ thành viên thu hồi push, giữ phiên chờ; đổi vai trò vẫn giữ đăng ký', async () => {
    const family = await test.family();
    const user = await test.session(family);
    await test.call(user, 'PUT', '/api/me/push-subscription', subscription(user.id));
    const admin = createFamilyAdminRepository(test.database);
    await admin.inTransaction(async (store) => {
      await store.changeRole(user.accountId, 'member');
    });
    const afterRole = await test.call(user, 'GET', '/api/me/push-config');
    expect(afterRole.status).toBe(200);
    expect(await afterRole.json()).toMatchObject({ registered: true });
    await admin.inTransaction(async (store) => {
      await store.remove(user.accountId);
    });
    expect(
      (await test.owner.query('SELECT family_id FROM accounts WHERE id=$1', [user.accountId])).rows[0]
        .family_id,
    ).toBeNull();
    expect(
      (await test.owner.query('SELECT id FROM push_subscriptions WHERE account_id=$1', [user.accountId]))
        .rows,
    ).toHaveLength(0);
    expect((await test.call(user, 'GET', '/api/me/push-config')).status).toBe(403);
    expect(await (await test.call(user, 'GET', '/api/me')).json()).toMatchObject({
      family: null,
      role: null,
    });
  });
});
