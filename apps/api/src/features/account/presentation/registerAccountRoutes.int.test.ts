import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { registerAccountResponseSchema } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';

describe('POST /api/auth/register (SPEC-059)', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  let testIp = '';
  beforeEach(() => {
    testIp = randomUUID();
  });
  const input = () => ({
    username: 'Me.Lan',
    password: 'StrongPassword123',
    displayName: 'Mẹ Lan',
    ageConfirmed: true,
    legalAcceptance: t.legalAcceptance,
  });
  const request = (
    body: unknown = input(),
    headers: Record<string, string> = {
      origin: 'https://angia.example',
      'content-type': 'application/json',
    },
  ) =>
    t.app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'x-test-ip': testIp, ...headers },
      body: JSON.stringify(body),
    });
  const countAccounts = async () =>
    (await t.pool.query('SELECT count(*)::int AS total FROM accounts')).rows[0].total;

  it('TC-846/851: năm request đầu đi tiếp, request sáu chặn trước validate/hash, IP khác được đăng ký', async () => {
    expect((await request({ ...input(), username: 'rate.exists' })).status).toBe(201);
    const before = await countAccounts();
    for (let i = 0; i < 4; i++) expect((await request({})).status).toBe(422);
    const existing = await request({ ...input(), username: 'RATE.EXISTS' });
    const fresh = await request({ ...input(), username: 'limited.new' });
    expect(existing.status).toBe(429);
    expect(fresh.status).toBe(429);
    expect(await existing.json()).toEqual(await fresh.json());
    expect(existing.headers.get('retry-after')).toMatch(/^[1-9][0-9]*$/);
    expect(existing.headers.get('set-cookie')).toBeNull();
    expect(await countAccounts()).toBe(before);
    testIp = randomUUID();
    expect((await request({ ...input(), username: 'other.ip' })).status).toBe(201);
  });
  it('Origin sai không tiêu hao bucket', async () => {
    for (let i = 0; i < 6; i++)
      expect(
        (await request({}, { origin: 'https://evil.example', 'content-type': 'application/json' })).status,
      ).toBe(403);
    for (let i = 0; i < 5; i++) expect((await request({})).status).toBe(422);
  });

  it('TC-905: hash busy trả HTTP 503, không có account/session/cookie', async () => {
    const before = await countAccounts();
    const sessionsBefore = (await t.pool.query('SELECT count(*)::int AS total FROM sessions')).rows[0].total;
    const hash = vi.spyOn(t.account.hasher, 'hash').mockRejectedValueOnce(new PasswordHashBusyError());
    try {
      const response = await request({ ...input(), username: 'busy.hash' });
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_AUTH_UNAVAILABLE' } });
      expect(response.headers.get('set-cookie')).toBeNull();
      expect(await countAccounts()).toBe(before);
      expect((await t.pool.query('SELECT count(*)::int AS total FROM sessions')).rows[0].total).toBe(
        sessionsBefore,
      );
    } finally {
      hash.mockRestore();
    }
  });

  it('TC-736: tạo Me.Lan thành me.lan, cookie phiên dùng được tại /api/me', async () => {
    const response = await request();
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const rawBody = await response.json();
    const body = registerAccountResponseSchema.parse(rawBody);
    expect(rawBody).toEqual({
      account: { id: expect.any(String), username: 'me.lan', displayName: 'Mẹ Lan', familyId: null },
      session: { csrfToken: expect.any(String), expiresAt: expect.any(String) },
    });
    expect(body.session.csrfToken.length).toBeGreaterThan(0);
    expect(new Date(body.session.expiresAt).toISOString()).toBe(body.session.expiresAt);
    expect(rawBody).not.toHaveProperty('session.sessionId');
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^angia_session=.+; Path=\/; Expires=[^;]+; HttpOnly; SameSite=Lax/);
    const me = await t.app.request('/api/me', { headers: { cookie: cookie.split(';')[0]! } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      account: { id: body.account.id, displayName: 'Mẹ Lan' },
      family: null,
      csrfToken: body.session.csrfToken,
    });
  });

  it('TC-737: trùng ME.LAN trả 409 và không đặt cookie', async () => {
    const response = await request({ ...input(), username: 'ME.LAN' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_USERNAME_TAKEN',
        message: 'Tên đăng nhập này đã có người dùng.',
      },
    });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('chưa xác nhận tuổi trả 422 kèm details.field từ domain', async () => {
    const response = await request({ ...input(), ageConfirmed: false });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'ERR_VALIDATION',
        details: { field: 'ageConfirmed' },
      },
    });
  });

  it('đóng đăng ký và không có lời mời trả 403', async () => {
    await t.owner.query(`INSERT INTO system_settings (key, value) VALUES ('registration_open', 'false')
      ON CONFLICT (key) DO UPDATE SET value = 'false'`);
    try {
      const response = await request();
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: {
          code: 'ERR_REGISTRATION_CLOSED',
          message: 'Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.',
        },
      });
    } finally {
      await t.owner.query(`DELETE FROM system_settings WHERE key = 'registration_open'`);
    }
  });

  it('phiên bản pháp lý cũ trả 409 kèm phiên bản hiện hành', async () => {
    const response = await request({
      ...input(),
      legalAcceptance: {
        ...t.legalAcceptance,
        termsVersionId: randomUUID(),
      },
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_LEGAL_VERSION_OUTDATED',
        message: 'Điều khoản vừa được cập nhật, vui lòng đọc lại.',
        details: { current: t.legalAcceptance },
      },
    });
  });

  it.each([
    { 'content-type': 'application/json' },
    { origin: 'https://evil.example', 'content-type': 'application/json' },
    { origin: 'https://angia.example', 'content-type': 'text/plain' },
    { origin: 'https://angia.example/', 'content-type': 'application/json' },
  ])(
    'thiếu/sai Origin hoặc sai Content-Type bị chặn trước validate, không tạo tài khoản: %j',
    async (headers) => {
      const before = await countAccounts();
      for (const body of [{ ...input(), username: 'blocked.user' }, {}]) {
        const response = await request(body, headers);
        expect(response.status).toBe(403);
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(response.headers.get('cache-control')).toBe('no-store');
      }
      expect(await countAccounts()).toBe(before);
    },
  );

  it.each([{}, { username: 123 }, { ageConfirmed: 'true' }])(
    'body thiếu/sai kiểu trả 422 với Origin đúng: %j',
    async (patch) => {
      const response = await request(Object.keys(patch).length ? { ...input(), ...patch } : {});
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      expect(response.headers.get('set-cookie')).toBeNull();
    },
  );
});
