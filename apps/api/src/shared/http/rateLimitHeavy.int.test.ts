import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const edits = { rotation: 0, crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 }, masks: [] };

describe('TC-300 — rate limit thao tác nặng theo tài khoản (SPEC-030)', () => {
  let t: ProfileTestApp;
  const clock = { now: 1_000_000 };
  beforeAll(async () => {
    t = await startProfileTestApp(undefined, { heavyRateLimit: { perMinute: 2, now: () => clock.now } });
  });
  afterAll(async () => t?.stop());

  const upload = (user: SeededSession, profileId: string) => {
    const form = new FormData();
    form.append('files', new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'a.jpg'));
    return t.app.request(`/api/health-profiles/${profileId}/upload-batches`, {
      method: 'POST',
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf },
      body: form,
    });
  };

  it('quá nhịp tải lô → 429 ERR_RATE_LIMITED kèm Retry-After, trước cả kiểm hồ sơ; tài khoản khác không bị ảnh hưởng', async () => {
    const familyId = await t.family();
    const first = await t.session(familyId);
    const second = await t.session(familyId);
    const missing = randomUUID();
    expect((await upload(first, missing)).status).toBe(404);
    expect((await upload(first, missing)).status).toBe(404);
    const limited = await upload(first, missing);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(await limited.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect((await upload(second, missing)).status).toBe(404);
    clock.now += 60_001;
    expect((await upload(first, missing)).status).toBe(404);
  });

  it('bản kiểm tra và xác nhận đếm riêng; GET trạng thái bản kiểm tra không bị đếm', async () => {
    const main = await t.session(await t.family());
    const path = `/api/source-documents/${randomUUID()}`;
    for (let i = 0; i < 3; i += 1)
      expect((await t.call(main, 'GET', `${path}/privacy-draft`)).status).toBe(404);
    expect((await t.call(main, 'POST', `${path}/privacy-drafts`, edits)).status).toBe(404);
    expect((await t.call(main, 'POST', `${path}/privacy-drafts`, edits)).status).toBe(404);
    expect((await t.call(main, 'POST', `${path}/privacy-drafts`, edits)).status).toBe(429);
    const approval = { draftId: randomUUID(), sha256: 'a'.repeat(64), confirmed: true };
    expect((await t.call(main, 'POST', `${path}/privacy-approval`, approval)).status).toBe(404);
  });
});
