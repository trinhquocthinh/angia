import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { householdInvitationFixture } from '@src/shared/test/householdInvitationFixture.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';
import type { RateLimitStore } from '@src/shared/rateLimit/application/ports.js';
import { errorJson } from '@src/shared/http/errorResponse.js';

async function expectLimited(response: Response) {
  expect(response.status).toBe(429);
  expect(await response.json()).toEqual(errorJson('ERR_RATE_LIMITED')[0]);
  const retry = Number(response.headers.get('retry-after'));
  expect(Number.isInteger(retry) && retry >= 1).toBe(true);
  expect(response.headers.get('cache-control')).toBe('no-store');
}

describe('E31-S3-T1: giới hạn lời mời qua route và PostgreSQL', () => {
  let t: ProfileTestApp;
  let f: ReturnType<typeof householdInvitationFixture>;
  let store: RateLimitStore;
  let now = 0;
  const keyHasher = createRateLimitKeyHasher('invitation-rate-limit-test-secret');
  beforeAll(async () => {
    t = await startProfileTestApp('http://localhost:5173', {
      accountRateLimit: {
        keyHasher,
        now: () => now,
        store: {
          increment: (key, start) => store.increment(key, start),
          read: (key, start) => store.read(key, start),
        },
      },
    });
    store = createRateLimitStore(t.database);
    f = householdInvitationFixture(t);
  });
  beforeEach(() => {
    now = (Math.floor(now / 86_400_000) + 1) * 86_400_000;
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-848: dùng chung quota theo nhà, đếm tái sử dụng và thay mã, nhà khác độc lập', async () => {
    const invite = await f.issue();
    const otherMain = await t.session(invite.familyId);
    const create = (user = invite.creator) =>
      t.call(user, 'POST', '/api/family/invitations', { kind: 'join_family', role: 'member' });
    for (let i = 0; i < 18; i++) expect((await create()).status).toBe(201);
    const replace = `/api/family/invitations/${invite.invitationId}/replace`;
    expect((await t.call(invite.creator, 'POST', replace, {})).status).toBe(201);
    await expectLimited(await create(otherMain));
    await expectLimited(await t.call(invite.creator, 'POST', replace, {}));
    expect(await store.read(keyHasher('invitation_create', invite.familyId), now)).toBe(22);
    expect((await f.issue()).invitationId).toBeTruthy();
    expect((await create(await t.session(invite.familyId, 'member'))).status).toBe(403);
    expect((await create(await f.waiting())).status).toBe(403);
    now += 86_400_000;
    expect((await create()).status).toBe(201);
  });

  it('TC-849: đủ 20 mã sai thì chặn cả token đúng và giữ lời mời chờ nhận', async () => {
    const invite = await f.issue();
    const waiting = await f.waiting();
    let generic: unknown;
    for (let i = 0; i < 20; i++) {
      const response = await f.accept(waiting, randomUUID());
      expect(response.status).toBe(404);
      const body = await response.json();
      generic ??= body;
      expect(body).toEqual(generic);
    }
    await expectLimited(await f.accept(waiting, invite.token));
    await expectLimited(await f.accept(await f.waiting(), randomUUID()));
    expect(await f.state(invite.invitationId)).toMatchObject({ accepted_at: null, accepted_by: null });
    expect(await f.membership(waiting.accountId)).toMatchObject({ family_id: null });
    expect(await f.audits(waiting.accountId)).toEqual([]);
    now += 3_600_000;
    expect((await f.accept(waiting, invite.token)).status).toBe(204);
  });

  it('TC-851: nhận đúng và lỗi nghiệp vụ dưới ngưỡng không tăng bộ đếm mã sai', async () => {
    const invite = await f.issue();
    expect((await f.accept(await t.session(await t.family()), invite.token)).status).toBe(409);
    const pending = await f.issue();
    await f.pendingDeletion(pending.familyId, pending.creator.accountId);
    expect((await f.accept(await f.waiting(), pending.token)).status).toBe(409);
    expect((await f.accept(await f.waiting(true), invite.token)).status).toBe(403);
    expect((await f.accept(await f.waiting(), invite.token)).status).toBe(204);
    expect(await store.read(keyHasher('invitation_accept_invalid', 'stub'), now)).toBe(0);
    const waiting = await f.waiting();
    for (let i = 0; i < 20; i++) expect((await f.accept(waiting, randomUUID())).status).toBe(404);
    expect(await store.read(keyHasher('invitation_accept_invalid', 'stub'), now)).toBe(20);
    await expectLimited(await f.accept(waiting, randomUUID()));
  });

  it('TC-851: phiên và CSRF bị từ chối trước khi tiêu quota tạo lời mời', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const path = '/api/family/invitations';
    expect((await t.app.request(path, { method: 'POST' })).status).toBe(401);
    expect((await t.app.request(path, { method: 'POST', headers: { cookie: main.cookie } })).status).toBe(
      403,
    );
    expect(await store.read(keyHasher('invitation_create', familyId), now)).toBe(0);
  });
  it('TC-848: body sai tính quota, GET không tính quota tạo lời mời', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const path = '/api/family/invitations';
    expect((await t.call(main, 'POST', path, {})).status).toBe(422);
    expect(
      (
        await t.app.request(path, {
          method: 'POST',
          headers: { cookie: main.cookie, 'x-csrf-token': main.csrf, 'content-type': 'application/json' },
          body: '{',
        })
      ).status,
    ).toBe(422);
    expect((await t.call(main, 'GET', path)).status).toBe(200);
    expect(await store.read(keyHasher('invitation_create', familyId), now)).toBe(2);
  });
});
