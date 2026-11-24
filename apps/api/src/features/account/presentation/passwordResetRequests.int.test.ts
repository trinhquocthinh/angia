import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startPasswordResetContext } from '@src/shared/test/passwordResetDbFixture.js';

describe('SPEC-063: yêu cầu đặt lại qua email HTTP/PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startPasswordResetContext>>;
  beforeAll(async () => {
    t = await startPasswordResetContext();
  });
  afterAll(async () => {
    await t?.drain();
    await t?.close();
  });
  it('TC-762: ba trạng thái email trả cùng status, body và headers trừ Date', async () => {
    const verified = await t.seed();
    const unverified = await t.seed(false);
    const responses = [];
    for (const email of [verified.email, unverified.email, `${randomUUID()}@example.com`]) {
      const response = await t.send(email);
      responses.push({
        status: response.status,
        body: await response.json(),
        headers: Object.fromEntries([...response.headers].filter(([key]) => key !== 'date')),
      });
    }
    expect(responses[0]).toMatchObject({
      status: 202,
      body: { received: true },
      headers: { 'cache-control': 'no-store' },
    });
    expect(responses[1]).toEqual(responses[0]);
    expect(responses[2]).toEqual(responses[0]);
    await t.drain();
  });
  it('TC-763: chỉ email đã xác minh không khoá nhận token và job đúng thời hạn', async () => {
    const verified = await t.seed();
    const now = new Date();
    t.setNow(now);
    const { job, token } = await t.link(verified.email);
    t.setNow();
    expect(job.data).toMatchObject({ to: verified.email, subject: 'Đặt lại mật khẩu AN GIA' });
    expect(job.data.text).toContain('https://angia.example/app/reset-password#token=');
    expect(job.data.text).toContain('trong 30 phút');
    expect(job.data.text).toContain('Nếu bạn không yêu cầu, hãy bỏ qua email này.');
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(job.deletion_seconds).toBe(60);
    expect(job.keep_until.getTime() - job.start_after.getTime()).toBe(1_800_000);
    const stored = await t.tokens(verified.id);
    expect(stored).toHaveLength(1);
    expect(stored[0].token_hash).toBe(t.digest(token));
    expect(stored[0].expires_at).toEqual(new Date(now.getTime() + 1_800_000));
    for (const account of [await t.seed(false), await t.seed(true, true)]) {
      await t.send(account.email);
      await t.drain();
      expect(await t.jobs(account.email)).toEqual([]);
      expect(await t.tokens(account.id)).toEqual([]);
    }
  });
  it('TC-766: mọi email không tồn tại vẫn tiêu cả hạn mức IP lẫn email chuẩn hoá', async () => {
    const ip = randomUUID();
    for (let i = 0; i < 3; i++) expect((await t.send(`${randomUUID()}@example.com`, ip)).status).toBe(202);
    const byIp = await t.send(`${randomUUID()}@example.com`, ip);
    expect(byIp.status).toBe(429);
    expect(byIp.headers.get('retry-after')).toMatch(/^[1-9][0-9]*$/);
    expect(await byIp.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    const email = `${randomUUID()}@example.com`;
    for (let i = 0; i < 3; i++) expect((await t.send(` ${email.toUpperCase()} `)).status).toBe(202);
    const byEmail = await t.send(email);
    expect(byEmail.status).toBe(429);
    expect(byEmail.headers.get('retry-after')).toMatch(/^[1-9][0-9]*$/);
    await t.drain();
  });
  it('TC-928: sau PATCH email, email cũ nhận link còn pending_email không nhận', async () => {
    const account = await t.seed();
    const pending = `${randomUUID()}@example.com`;
    const changed = await t.app.request('/api/me/email', {
      method: 'PATCH',
      headers: {
        cookie: account.device.cookie,
        'x-csrf-token': account.device.csrf,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: pending, currentPassword: account.password }),
    });
    expect(changed.status).toBe(200);
    await t.link(account.email);
    await t.send(pending);
    await t.drain();
    expect(await t.jobs(account.email)).toHaveLength(1);
    expect(await t.jobs(pending)).toEqual([]);
    expect(await t.tokens(account.id)).toHaveLength(1);
  });
  it.each(['password-reset-requests', 'password-resets'])(
    'TC-763: %s từ Origin sai bị chặn',
    async (path) => {
      const response = await t.request(
        path,
        { email: 'a@example.com', token: 'bad', newPassword: 'Strong123' },
        randomUUID(),
        'https://evil.example',
      );
      expect(response.status).toBe(403);
      expect(response.headers.get('cache-control')).toBe('no-store');
    },
  );
});
