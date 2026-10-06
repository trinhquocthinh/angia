import { createStubInvitationDeps } from '@src/shared/test/createStubInvitationDeps.js';
import { createStubProfileRepository } from '@src/shared/test/createStubProfileRepository.js';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@src/createApp.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { createSilentLogger } from '@src/shared/test/createSilentLogger.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import type { OidcClient } from '../application/ports.js';
import { createAccountRepository } from '../infrastructure/createAccountRepository.js';
import { createSessionRepository } from '../infrastructure/createSessionRepository.js';

const AUTHORIZE_URL = 'https://idp.test/application/o/authorize/?client_id=angia-dev&state=st-1';

// IdP giả: kiểm state như openid-client.
const fakeOidc: OidcClient = {
  createAuthorizationRequest: () =>
    Promise.resolve({
      url: new URL(AUTHORIZE_URL),
      pending: { state: 'st-1', codeVerifier: 'cv-1', nonce: 'n-1' },
    }),
  exchangeCode: (params, pending) =>
    params.get('state') === pending.state && params.get('code') === 'good-code'
      ? Promise.resolve({ subject: 'sub-admin', name: 'Thịnh', groups: ['angia-sit-users', 'angia-admins'] })
      : Promise.reject(new Error('state mismatch')),
};

function cookiesOf(response: Response): string[] {
  return response.headers.getSetCookie();
}

function cookiePair(setCookie: string[], name: string): string {
  const found = setCookie.find((cookie) => cookie.startsWith(`${name}=`));
  return found?.split(';')[0] ?? '';
}

describe('GET /api/auth/login + /api/auth/callback', () => {
  let db: TestDatabase;
  let pool: pg.Pool;
  let app: ReturnType<typeof createApp>;

  const login = async () => {
    const response = await app.request('/api/auth/login');
    return { response, cookie: cookiePair(cookiesOf(response), 'angia_oidc') };
  };

  const countSessions = async () => {
    const { rows } = await pool.query<{ total: number }>(`SELECT count(*)::int AS total FROM sessions`);
    return rows[0]?.total;
  };

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    pool = new pg.Pool({ connectionString: db.appUrl });
    const database = createDatabase(pool);
    app = createApp({
      consentInvitations: createStubInvitationDeps(),
      healthProbes: { db: () => Promise.resolve(), storage: () => Promise.resolve() },
      auth: {
        login: {
          oidc: fakeOidc,
          accounts: createAccountRepository(database),
          sessions: createSessionRepository(database),
          adminGroupName: 'angia-admins',
          generateToken: () => 'csrf-1',
          now: () => new Date(),
        },
        cookieSecret: 'test-secret-test-secret-test-secret',
        secureCookies: true,
        logger: createSilentLogger(),
      },
      profiles: createStubProfileRepository(),
      familyAdmin: createFakeFamilyAdminRepository().repository,
    });
  });

  afterAll(async () => {
    await pool?.end();
    await db?.container.stop();
  });

  it('login chuyển hướng sang Authentik và đặt cookie PKCE ký, HttpOnly, chỉ trong /api/auth', async () => {
    const { response, cookie } = await login();
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(AUTHORIZE_URL);
    const setCookie = cookiesOf(response).join('\n');
    expect(setCookie).toMatch(/angia_oidc=.+; Max-Age=600; Path=\/api\/auth; HttpOnly; Secure; SameSite=Lax/);
    expect(cookie).not.toBe('');
  });

  it('callback thành công: upsert admin, tạo phiên, đặt cookie angia_session, không lộ token', async () => {
    const { cookie } = await login();
    const response = await app.request('/api/auth/callback?code=good-code&state=st-1', {
      headers: { cookie },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/');
    const setCookie = cookiesOf(response).join('\n');
    expect(setCookie).toMatch(/angia_session=.+; Path=\/; Expires=[^;]+; HttpOnly; Secure; SameSite=Lax/);
    expect(setCookie).toMatch(/angia_oidc=; Max-Age=0; Path=\/api\/auth/);
    // Trình duyệt chỉ nhận cookie phiên (+ lệnh xóa cookie PKCE), không có body chứa token.
    expect(
      cookiesOf(response)
        .map((cookie) => cookie.split('=')[0])
        .sort(),
    ).toEqual(['angia_oidc', 'angia_session']);
    expect(await response.text()).toBe('');
    const { rows } = await pool.query(
      `SELECT a.display_name, a.is_system_admin, s.csrf_token FROM sessions s JOIN accounts a ON a.id = s.account_id`,
    );
    expect(rows).toEqual([{ display_name: 'Thịnh', is_system_admin: true, csrf_token: 'csrf-1' }]);
  });

  it('callback sai state: về /login?error=auth, không tạo phiên', async () => {
    const before = await countSessions();
    const { cookie } = await login();
    const response = await app.request('/api/auth/callback?code=good-code&state=forged', {
      headers: { cookie },
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?error=auth');
    expect(cookiesOf(response).join('\n')).not.toContain('angia_session=');
    expect(await countSessions()).toBe(before);
  });

  it('callback thiếu hoặc giả mạo cookie PKCE: về /login?error=auth', async () => {
    const missing = await app.request('/api/auth/callback?code=good-code&state=st-1');
    expect(missing.headers.get('location')).toBe('/login?error=auth');

    const forged = await app.request('/api/auth/callback?code=good-code&state=st-1', {
      headers: { cookie: 'angia_oidc=%7B%22state%22%3A%22st-1%22%7D.forged-signature' },
    });
    expect(forged.headers.get('location')).toBe('/login?error=auth');
  });
});
