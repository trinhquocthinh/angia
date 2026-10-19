import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
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

  const consentedProfile = async () => {
    const main = await t.session(await t.family());
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Bà' });
    const profileId = ((await created.json()) as HealthProfile).id;
    await acceptConsentInvitation(t, main, profileId);
    return { main, profileId };
  };
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

  it('lô bị 503 vì hết slot không tiêu nhịp: web tự gửi lại khi bận vẫn không bị 429', async () => {
    const busy = await consentedProfile();
    const encoder = new TextEncoder();
    const releases: Array<() => void> = [];
    const slow = () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      releases.push(release);
      let sent = false;
      const body = new ReadableStream<Uint8Array>(
        {
          async pull(controller) {
            if (sent) return;
            sent = true;
            controller.enqueue(
              encoder.encode(`--b\r\nContent-Disposition: form-data; name="files"; filename="a.jpg"\r\n\r\n`),
            );
            await gate;
            controller.enqueue(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]));
            controller.enqueue(encoder.encode('\r\n--b--\r\n'));
            controller.close();
          },
        },
        { highWaterMark: 0 },
      );
      return t.app.request(`/api/health-profiles/${busy.profileId}/upload-batches`, {
        method: 'POST',
        headers: {
          cookie: busy.main.cookie,
          'x-csrf-token': busy.main.csrf,
          'content-type': 'multipart/form-data; boundary=b',
        },
        body,
        duplex: 'half',
      } as RequestInit);
    };
    clock.now += 120_000;
    const holders = [slow()];
    await new Promise((resolve) => setTimeout(resolve, 200));
    holders.push(slow());
    clock.now += 60_001;
    holders.push(slow());
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = await consentedProfile();
    for (let i = 0; i < 3; i += 1) expect((await upload(user.main, user.profileId)).status).toBe(503);
    releases.forEach((release) => release());
    await Promise.all(holders);
    expect((await upload(user.main, user.profileId)).status).toBe(201);
  });
});
