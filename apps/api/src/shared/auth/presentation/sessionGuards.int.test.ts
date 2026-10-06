import { createStubInvitationDeps } from '@src/shared/test/createStubInvitationDeps.js';
import { createStubProfileRepository } from '@src/shared/test/createStubProfileRepository.js';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@src/createApp.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import {
  type SeededSession,
  seedAccount as seedAccountRow,
  seedSession as seedSessionRow,
  TEST_COOKIE_SECRET,
} from '@src/shared/test/seedAuthFixtures.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createSessionRepository } from '../infrastructure/createSessionRepository.js';
import { requireAdmin } from './requireAdmin.js';
import { requireMain } from './requireMain.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Phiên, CSRF, requireMain/requireAdmin và GET /api/me', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  let pool: pg.Pool;
  let app: ReturnType<typeof createApp>;
  let familyId: string;

  const seedAccount = (fields: { familyRole?: 'main' | 'member'; admin?: boolean } = {}) =>
    seedAccountRow(owner, { ...fields, ...(fields.familyRole ? { familyId } : {}) });

  const seedSession = (accountId: string, expiresInMs?: number) =>
    seedSessionRow(owner, accountId, expiresInMs);

  const sessionExists = async (id: string) =>
    (await owner.query(`SELECT 1 FROM sessions WHERE id = $1`, [id])).rowCount === 1;

  const logout = (session: SeededSession, csrf?: string) =>
    app.request('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: session.cookie, ...(csrf === undefined ? {} : { 'x-csrf-token': csrf }) },
    });

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    familyId = randomUUID();
    await owner.query(`INSERT INTO families (id, name) VALUES ($1, 'Nhà A')`, [familyId]);
    pool = new pg.Pool({ connectionString: db.appUrl });
    const stub = createStubAuthDeps();
    app = createApp({
      consentInvitations: createStubInvitationDeps(),
      healthProbes: { db: () => Promise.resolve(), storage: () => Promise.resolve() },
      auth: {
        ...stub,
        login: { ...stub.login, sessions: createSessionRepository(createDatabase(pool)) },
        cookieSecret: TEST_COOKIE_SECRET,
      },
      profiles: createStubProfileRepository(),
      familyAdmin: createFakeFamilyAdminRepository().repository,
    });
    app.get('/api/test/main-only', requireMain(), (c) => c.text('ok'));
    app.get('/api/test/admin-only', requireAdmin(), (c) => c.text('ok'));
  });

  afterAll(async () => {
    await pool?.end();
    await owner?.end();
    await db?.container.stop();
  });

  it('GET /api/me không có cookie phiên trả 401 ERR_UNAUTHENTICATED', async () => {
    const response = await app.request('/api/me');
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_UNAUTHENTICATED',
        message: 'Phiên làm việc đã kết thúc hoặc không hợp lệ. Vui lòng đăng nhập lại.',
      },
    });
  });

  it('cookie giả chữ ký hoặc phiên đã hết hạn đều trả 401', async () => {
    const expired = await seedSession(await seedAccount(), -1000);
    const forged = `angia_session=${expired.id}.forged-signature`;
    for (const cookie of [forged, expired.cookie]) {
      const response = await app.request('/api/me', { headers: { cookie } });
      expect(response.status).toBe(401);
    }
  });

  it('tài khoản chờ gán nhóm: /api/me trả tài khoản, family và role null, kèm csrfToken', async () => {
    const session = await seedSession(await seedAccount());
    const response = await app.request('/api/me', { headers: { cookie: session.cookie } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      account: {
        id: session.accountId,
        displayName: 'Người chờ',
        isSystemAdmin: false,
        healthProfileId: null,
      },
      family: null,
      role: null,
      csrfToken: session.csrf,
    });
  });

  it('tài khoản main: /api/me trả nhóm và vai trò', async () => {
    const session = await seedSession(await seedAccount({ familyRole: 'main' }));
    const body = await (await app.request('/api/me', { headers: { cookie: session.cookie } })).json();
    expect(body).toMatchObject({ family: { id: familyId, name: 'Nhà A' }, role: 'main' });
  });

  it('phiên dùng sau ≥ 1 ngày được trượt hạn 30 ngày và đặt lại cookie; phiên mới thì không', async () => {
    const aging = await seedSession(await seedAccount(), 10 * DAY_MS);
    const agingResponse = await app.request('/api/me', { headers: { cookie: aging.cookie } });
    expect(agingResponse.headers.getSetCookie().join('\n')).toMatch(/angia_session=.+; Path=\/; Expires=/);
    const { rows } = await owner.query<{ days: number }>(
      `SELECT extract(epoch FROM expires_at - now()) / 86400 AS days FROM sessions WHERE id = $1`,
      [aging.id],
    );
    expect(Number(rows[0]?.days)).toBeGreaterThan(29.9);

    const fresh = await seedSession(await seedAccount());
    const freshResponse = await app.request('/api/me', { headers: { cookie: fresh.cookie } });
    expect(freshResponse.headers.getSetCookie()).toEqual([]);
  });

  it('TC-078: POST thiếu hoặc sai X-CSRF-Token bị từ chối ERR_FORBIDDEN, phiên không bị xóa', async () => {
    const session = await seedSession(await seedAccount({ familyRole: 'main' }));
    for (const csrf of [undefined, 'sai-token', `${session.csrf}x`]) {
      const response = await logout(session, csrf);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    }
    expect(await sessionExists(session.id)).toBe(true);
  });

  it('POST /api/auth/logout đúng CSRF: xóa phiên, xóa cookie; phiên cũ không dùng lại được', async () => {
    const session = await seedSession(await seedAccount());
    const response = await logout(session, session.csrf);
    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie().join('\n')).toMatch(/angia_session=; Max-Age=0; Path=\//);
    expect(await sessionExists(session.id)).toBe(false);
    expect((await app.request('/api/me', { headers: { cookie: session.cookie } })).status).toBe(401);
  });

  it('request đột biến không có phiên trả 401 trước khi xét CSRF', async () => {
    const response = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': 'x' },
    });
    expect(response.status).toBe(401);
  });

  it('requireMain: chỉ main qua; member và tài khoản chờ gán nhóm nhận ERR_FORBIDDEN', async () => {
    const cases = [
      { account: await seedAccount({ familyRole: 'main' }), status: 200 },
      { account: await seedAccount({ familyRole: 'member' }), status: 403 },
      { account: await seedAccount(), status: 403 },
    ];
    for (const { account, status } of cases) {
      const { cookie } = await seedSession(account);
      expect((await app.request('/api/test/main-only', { headers: { cookie } })).status).toBe(status);
    }
  });

  it('requireAdmin: chỉ is_system_admin qua; main thường nhận ERR_FORBIDDEN', async () => {
    const admin = await seedSession(await seedAccount({ admin: true }));
    const main = await seedSession(await seedAccount({ familyRole: 'main' }));
    expect((await app.request('/api/test/admin-only', { headers: { cookie: admin.cookie } })).status).toBe(
      200,
    );
    expect((await app.request('/api/test/admin-only', { headers: { cookie: main.cookie } })).status).toBe(
      403,
    );
  });
});
