import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedLegalAcceptance } from '@src/shared/test/seedLegalAcceptance.js';
import { seedSession } from '@src/shared/test/seedAuthFixtures.js';

describe('SPEC-085: cổng phiên, CSRF và Origin của route email', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let device: Awaited<ReturnType<typeof seedSession>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
    const id = randomUUID();
    await t.owner.query('INSERT INTO accounts(id,username_normalized,display_name) VALUES($1,$2,$3)', [
      id,
      id.slice(0, 20),
      'Người thử',
    ]);
    await seedLegalAcceptance(t.owner, id);
    device = await seedSession(t.owner, id);
  });
  afterAll(async () => {
    await t?.close();
  });
  const routes = [
    {
      path: '/api/me/email',
      method: 'PATCH',
      body: { email: 'lan@example.com', currentPassword: 'password' },
    },
    { path: '/api/me/email-verifications', method: 'POST', body: undefined },
  ];
  it.each(routes)('TC-932: thiếu phiên trả 401 tại $path', async ({ path, method, body }) => {
    const response = await t.app.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_UNAUTHENTICATED' } });
  });
  it.each(routes)('TC-932: thiếu CSRF trả 403 tại $path', async ({ path, method, body }) => {
    const response = await t.app.request(path, {
      method,
      headers: { cookie: device.cookie, 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
  });
  it.each(routes)('TC-932: phiên hạn chế bị chặn tại $path', async ({ path, method, body }) => {
    await t.owner.query('UPDATE sessions SET password_change_required=true WHERE id=$1', [device.id]);
    try {
      const response = await t.app.request(path, {
        method,
        headers: { cookie: device.cookie, 'x-csrf-token': device.csrf, 'content-type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } });
    } finally {
      await t.owner.query('UPDATE sessions SET password_change_required=false WHERE id=$1', [device.id]);
    }
  });
  it.each([
    { origin: 'https://khac.example', type: 'application/json' },
    { origin: 'https://angia.example', type: 'text/plain' },
  ])('TC-925: xác nhận từ chối Origin hoặc Content-Type sai ($origin, $type)', async ({ origin, type }) => {
    const response = await t.app.request('/api/auth/email-verifications/confirm', {
      method: 'POST',
      headers: { origin, 'content-type': type },
      body: JSON.stringify({ token: 'token-rac' }),
    });
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
  });
});
