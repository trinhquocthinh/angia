import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@src/createApp.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { createStubReviewDeps } from '@src/shared/test/createStubReviewDeps.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { createStubAiBudgetDeps } from '@src/shared/test/createStubAiBudgetDeps.js';
import { createStubDocumentDeps } from '@src/shared/test/createStubDocumentDeps.js';
import { createStubProfileDeps } from '@src/shared/test/createStubProfileDeps.js';
import { createStubProfileLinkDeps } from '@src/shared/test/createStubProfileLinkDeps.js';
import { createStubAccountDeps } from '@src/shared/test/createStubAccountDeps.js';

function fixture(enrollmentEnabled = true) {
  const now = new Date();
  const session: SessionContext = {
    sessionId: 'session',
    authMethod: 'oidc',
    oidcAuthTime: now,
    passwordChangeRequired: false,
    csrfToken: 'csrf',
    expiresAt: new Date(now.getTime() + 30 * 86400000),
    account: { id: 'account', displayName: 'Người thử', isSystemAdmin: false, healthProfileId: null },
    family: null,
    role: null,
  };
  const auth = createStubAuthDeps();
  auth.login.sessions.findActive = vi.fn(async () => session);
  const account = {
    ...createStubAccountDeps(),
    enrollmentEnabled,
    enrollments: {
      findAccount: vi.fn(async () => ({ oidcSubject: 'sub', usernameNormalized: null, lockedAt: null })),
      insertIfAbsent: vi.fn(async () => ({ ok: true as const })),
    },
    hasher: { hash: vi.fn(async () => 'hash'), verify: vi.fn(), needsRehash: () => false },
  };
  // Cookie ký thật để đi qua loadSession và CSRF của createApp.
  const app = createApp({
    ...createStubReviewDeps(),
    auth,
    account,
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
    healthProbes: { db: async () => {}, storage: async () => {} },
  });
  const request = async (body = '{"password":"NewPassword123"}', csrf = 'csrf', signed = true) => {
    const { serializeSigned } = await import('hono/utils/cookie');
    const cookie = await serializeSigned('angia_session', 'session', auth.cookieSecret);
    return app.request('/api/me/local-credential', {
      method: 'POST',
      headers: {
        cookie: signed ? cookie.split(';')[0]! : '',
        'content-type': 'application/json',
        'x-csrf-token': csrf,
      },
      body,
    });
  };
  return { auth, account, session, request };
}
describe('HTTP thiết lập credential local', () => {
  it('TC-900: trả 204 không body hoặc cookie mới, no-store', async () => {
    const { request } = fixture();
    const response = await request();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('TC-902: flag tắt trả 404 trước đọc body hoặc hash', async () => {
    const { account, request } = fixture(false);
    const response = await request('JSON hỏng');
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    expect(account.hasher.hash).not.toHaveBeenCalled();
    expect(account.enrollments.findAccount).not.toHaveBeenCalled();
  });
  it('TC-901: CSRF sai trả 403 trước hash', async () => {
    const { account, request } = fixture();
    const response = await request('{}', 'sai');
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(account.enrollments.findAccount).not.toHaveBeenCalled();
  });
  it('TC-901: thiếu phiên trả 401', async () => {
    const { request } = fixture();
    const response = await request('{}', 'csrf', false);
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each([{}, { password: '' }, { password: 'x'.repeat(1025) }])(
    'TC-901: body sai %j trả 422',
    async (body) => {
      const { request, account } = fixture();
      expect((await request(JSON.stringify(body))).status).toBe(422);
      expect(account.hasher.hash).not.toHaveBeenCalled();
    },
  );
  it('TC-901: mật khẩu yếu trả details.field password', async () => {
    const { request } = fixture();
    const response = await request('{"password":"short"}');
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_VALIDATION', details: { field: 'password' } },
    });
  });
  it('TC-902: hash lỗi trả 503 và log chỉ tên lớp lỗi', async () => {
    const { request, account, auth } = fixture();
    auth.logger.warn = vi.fn();
    account.hasher.hash.mockRejectedValue(new Error('bí mật'));
    const response = await request();
    expect(response.status).toBe(503);
    expect(auth.logger.warn).toHaveBeenCalledExactlyOnceWith(
      { reason: 'Error' },
      'Thiết lập mật khẩu tạm gián đoạn',
    );
    expect(account.enrollments.insertIfAbsent).not.toHaveBeenCalled();
  });
});

it('TC-902: flag tắt trả 404 ngay cả khi chưa có phiên, không đọc body', async () => {
  const { request } = fixture(false);
  const response = await request('JSON hỏng', 'sai', false);
  expect(response.status).toBe(404);
  expect(response.headers.get('cache-control')).toBe('no-store');
});

it('TC-901: phiên local hạn chế bị guard chặn ERR_PASSWORD_CHANGE_REQUIRED trước hash', async () => {
  const { request, session, account } = fixture();
  session.authMethod = 'local';
  session.passwordChangeRequired = true;
  const response = await request();
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } });
  expect(account.hasher.hash).not.toHaveBeenCalled();
});
