import { seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { sendPushTest } from '../application/sendPushTest.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { createPushSubscriptionRepository } from './createPushSubscriptionRepository.js';

let t: ProfileTestApp;
beforeAll(async () => {
  t = await startProfileTestApp();
});
afterAll(async () => {
  await t?.stop();
});
const value = () => ({
  endpoint: `https://web.push.apple.com/${randomUUID()}`,
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
});
async function device() {
  const familyId = await t.family();
  const user = await t.session(familyId);
  const actor = { familyId, accountId: user.accountId, sessionId: user.id };
  const repository = createPushSubscriptionRepository(t.database);
  const subscription = value();
  await repository.save(actor, subscription, new Date());
  const row = (await t.owner.query('SELECT id FROM push_subscriptions WHERE account_id=$1', [user.accountId]))
    .rows[0];
  return { actor: { ...actor, deviceId: row.id as string }, repository, subscription, user };
}
describe('Vòng đời thiết bị độc lập phiên', () => {
  it('TC-353: phiên hết hạn vẫn giữ đích gửi, API quản lý từ chối401', async () => {
    const d = await device();
    await t.owner.query("UPDATE sessions SET expires_at=now()-interval '1 day' WHERE id=$1", [d.user.id]);
    expect(await d.repository.read(d.actor, new Date())).toEqual(d.subscription);
    expect((await t.call(d.user, 'GET', '/api/me/push-config')).status).toBe(401);
  });
  it('TC-354: dọn dòng session không xóa đăng ký thiết bị', async () => {
    const d = await device();
    await t.owner.query('DELETE FROM sessions WHERE id=$1', [d.user.id]);
    expect(await d.repository.read(d.actor, new Date())).toEqual(d.subscription);
  });
});

it('TC-364: phiên hết hạn không giải phóng quota, endpoint mới không bị kết quả410 cũ gỡ', async () => {
  const d = await device();
  for (let i = 0; i < 9; i++) {
    const user = await seedSession(t.owner, d.user.accountId);
    await d.repository.save({ ...d.actor, deviceId: null, sessionId: user.id }, value(), new Date());
  }
  await t.owner.query("UPDATE sessions SET expires_at=now()-interval '1 day' WHERE account_id=$1", [
    d.user.accountId,
  ]);
  const fresh = await seedSession(t.owner, d.user.accountId);
  expect(
    await d.repository.save({ ...d.actor, deviceId: null, sessionId: fresh.id }, value(), new Date()),
  ).toBe('quota');
  const updated = value();
  const actor = { ...d.actor, sessionId: fresh.id };
  expect(
    await sendPushTest(
      {
        repository: d.repository,
        publicKey: 'public',
        now: () => new Date(),
        sender: {
          send: async () => {
            await d.repository.save(actor, updated, new Date());
            return 'gone';
          },
        },
      },
      actor,
    ),
  ).toBe('gone');
  expect(await d.repository.read(actor, new Date())).toEqual(updated);
});

it('TC-899: uỷ quyền Push ghi và đổi nguồn theo phiên thật, giữ nguồn khi session bị xoá', async () => {
  const d = await device();
  await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [d.user.id]);
  await d.repository.save(d.actor, d.subscription, new Date());
  const source = async () =>
    (
      await t.owner.query('SELECT auth_method,last_session_id FROM push_subscriptions WHERE id=$1', [
        d.actor.deviceId,
      ])
    ).rows[0];
  expect(await source()).toEqual({ auth_method: 'local', last_session_id: d.user.id });
  await t.owner.query('DELETE FROM sessions WHERE id=$1', [d.user.id]);
  expect(await source()).toEqual({ auth_method: 'local', last_session_id: null });
  const oidc = await seedSession(t.owner, d.user.accountId);
  await d.repository.save({ ...d.actor, sessionId: oidc.id }, d.subscription, new Date());
  expect(await source()).toEqual({ auth_method: 'oidc', last_session_id: oidc.id });
});

it('TC-904: account khoá không uỷ quyền lại Push dù dòng phiên còn tồn tại', async () => {
  const d = await device();
  await t.owner.query('UPDATE accounts SET locked_at=now() WHERE id=$1', [d.user.accountId]);
  expect(await d.repository.save(d.actor, value(), new Date())).toBe('expired');
});
