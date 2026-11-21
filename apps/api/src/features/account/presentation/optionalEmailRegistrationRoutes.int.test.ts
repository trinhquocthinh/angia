import { randomUUID } from 'node:crypto';
import { registerAccountResponseSchema } from '@angia/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';

describe('Đăng ký email tùy chọn (SPEC-059)', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  const request = (email?: string | null) =>
    t.app.request('/api/auth/register', {
      method: 'POST',
      headers: {
        origin: 'https://angia.example',
        'content-type': 'application/json',
        'x-test-ip': randomUUID(),
      },
      body: JSON.stringify({
        username: `user.${randomUUID().slice(0, 8)}`,
        password: 'StrongPassword123',
        displayName: 'Thử',
        ageConfirmed: true,
        legalAcceptance: t.legalAcceptance,
        ...(email === undefined ? {} : { email }),
      }),
    });
  const jobs = async () =>
    (
      await t.owner.query(
        "SELECT count(*)::int AS total FROM pgboss.job WHERE name='send-transactional-email'",
      )
    ).rows[0].total;
  it.each([undefined, null])(
    'TC-921: email vắng hoặc null đăng ký 201, không xếp mail: %s',
    async (email) => {
      const before = await jobs();
      const response = await request(email);
      expect(response.status).toBe(201);
      const body = registerAccountResponseSchema.parse(await response.json());
      expect(
        (await t.owner.query('SELECT email,email_verified_at FROM accounts WHERE id=$1', [body.account.id]))
          .rows,
      ).toEqual([{ email: null, email_verified_at: null }]);
      expect(await jobs()).toBe(before);
    },
  );
  it('TC-922: hai email chưa xác minh trùng chữ thường đều được lưu, không xếp mail', async () => {
    const before = await jobs();
    for (const email of ['lan@example.com', ' LAN@Example.COM ']) {
      const response = await request(email);
      expect(response.status).toBe(201);
      const body = registerAccountResponseSchema.parse(await response.json());
      expect(
        (await t.owner.query('SELECT email,email_verified_at FROM accounts WHERE id=$1', [body.account.id]))
          .rows,
      ).toEqual([{ email: 'lan@example.com', email_verified_at: null }]);
    }
    expect(await jobs()).toBe(before);
  });
  it.each(['sai-email', `${'a'.repeat(243)}@example.com`])(
    'TC-922: email không hợp lệ trả ERR_VALIDATION: %s',
    async (email) => {
      const response = await request(email);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({
        error: { code: 'ERR_VALIDATION', details: { field: 'email' } },
      });
    },
  );
});
