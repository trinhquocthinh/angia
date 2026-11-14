import { randomUUID } from 'node:crypto';
import { serializeSigned } from 'hono/utils/cookie';
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

function fixture() {
  const session: SessionContext = {
    sessionId: 'session',
    authMethod: 'local',
    oidcAuthTime: null,
    passwordChangeRequired: false,
    csrfToken: 'csrf',
    expiresAt: new Date(Date.now() + 30 * 86400000),
    account: { id: randomUUID(), displayName: 'Người thử', isSystemAdmin: true, healthProfileId: null },
    family: null,
    role: null,
  };
  const docs = {
    terms: {
      id: randomUUID(),
      kind: 'terms' as const,
      version: '2',
      publishedAt: '2026-01-01T00:00:00.000Z',
      material: true,
      url: '/legal/terms.md',
    },
    privacy: {
      id: randomUUID(),
      kind: 'privacy' as const,
      version: '2',
      publishedAt: '2026-01-01T00:00:00.000Z',
      material: true,
      url: '/legal/privacy.md',
    },
  };
  const legal = {
    current: vi.fn(async () => docs),
    status: vi.fn(async () => ({ accepted: false, missingDocuments: false })),
    accept: vi.fn(async () => ({
      ok: true as boolean,
      current: { termsVersionId: docs.terms.id, privacyVersionId: docs.privacy.id },
    })),
  };
  const auth = createStubAuthDeps();
  auth.login.sessions.findActive = vi.fn(async () => session);
  auth.login.sessions.delete = vi.fn(async () => {});
  auth.logger.warn = vi.fn();
  const deps = {
    ...createStubReviewDeps(),
    legal,
    auth,
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
    healthProbes: { db: async () => {}, storage: async () => {} },
  };
  const app = createApp(deps);
  const request = async (path: string, method = 'GET', body?: unknown, csrf = 'csrf', signed = true) => {
    const cookie = await serializeSigned('angia_session', 'session', auth.cookieSecret);
    return app.request(path, {
      method,
      headers: {
        cookie: signed ? cookie.split(';')[0]! : '',
        'x-csrf-token': csrf,
        'content-type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  };
  return { request, legal, docs, session, auth };
}

describe('SPEC-061: văn bản và gate legal', () => {
  it.each(['local', 'oidc'] as const)(
    'TC-752: chặn cả SystemAdmin phiên %s khi chưa đồng ý',
    async (authMethod) => {
      const t = fixture();
      t.session.authMethod = authMethod;
      const response = await t.request('/api/admin/families');
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'ERR_LEGAL_ACCEPTANCE_REQUIRED',
          message: 'Vui lòng đọc và đồng ý Điều khoản mới để tiếp tục.',
        },
      });
    },
  );
  it('TC-752: thiếu văn bản đóng gate và chỉ log thông điệp cố định', async () => {
    const t = fixture();
    t.legal.status.mockResolvedValue({ accepted: false, missingDocuments: true });
    expect((await t.request('/api/protected')).status).toBe(403);
    expect(t.auth.logger.warn).toHaveBeenCalledExactlyOnceWith('Thiếu văn bản pháp lý hiện hành');
  });
  it('TC-752: lỗi DB trả ERR_INTERNAL, không mở gate', async () => {
    const t = fixture();
    t.legal.status.mockRejectedValue(new Error('DB'));
    const response = await t.request('/api/protected');
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INTERNAL' } });
  });
  it('TC-752: guard mật khẩu chạy trước legal', async () => {
    const t = fixture();
    t.session.passwordChangeRequired = true;
    const response = await t.request('/api/protected');
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } });
    expect(t.legal.status).not.toHaveBeenCalled();
  });
  it('TC-752: GET hiện hành công khai, không cần phiên và không đọc gate', async () => {
    const t = fixture();
    const response = await t.request('/api/legal/current', 'GET', undefined, '', false);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(t.docs);
    expect(t.legal.status).not.toHaveBeenCalled();
  });
  it('TC-752: GET hiện hành thiếu kind trả ERR_INTERNAL', async () => {
    const t = fixture();
    t.legal.current.mockRejectedValue(new Error('Thiếu văn bản pháp lý hiện hành'));
    expect((await t.request('/api/legal/current', 'GET', undefined, '', false)).status).toBe(500);
  });
  it.each([
    ['GET', '/api/me'],
    ['POST', '/api/auth/logout'],
    ['POST', '/api/me/password'],
    ['POST', '/api/me/local-credential'],
    ['POST', '/api/me/legal-acceptances'],
  ])('TC-752: miễn đúng %s %s', async (method, path) => {
    const t = fixture();
    await t.request(path!, method!, method === 'GET' ? undefined : {});
    expect(t.legal.status).not.toHaveBeenCalled();
  });
  it.each([
    ['POST', '/api/me'],
    ['GET', '/api/me/password'],
    ['GET', '/api/me/legal-acceptances'],
    ['GET', '/api/me/child'],
    ['GET', '/api/me/'],
  ])('TC-752: không miễn sai method hoặc hậu tố %s %s', async (method, path) => {
    const t = fixture();
    expect((await t.request(path!, method!)).status).toBe(403);
  });
  it('TC-753: ghi đồng ý trả 204 và no-store', async () => {
    const t = fixture();
    const versionIds = [t.docs.terms.id, t.docs.privacy.id];
    const response = await t.request('/api/me/legal-acceptances', 'POST', { versionIds });
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(t.legal.accept).toHaveBeenCalledWith(t.session.account.id, versionIds);
  });
  it('TC-753: bản cũ trả 409 kèm details.current', async () => {
    const t = fixture();
    t.legal.accept.mockResolvedValue({
      ok: false,
      current: { termsVersionId: t.docs.terms.id, privacyVersionId: t.docs.privacy.id },
    });
    const response = await t.request('/api/me/legal-acceptances', 'POST', { versionIds: [randomUUID()] });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'ERR_LEGAL_VERSION_OUTDATED',
        details: { current: { termsVersionId: t.docs.terms.id, privacyVersionId: t.docs.privacy.id } },
      },
    });
  });
  it.each([
    {},
    { versionIds: [] },
    { versionIds: ['sai'] },
    { versionIds: [randomUUID(), randomUUID(), randomUUID()] },
    { versionIds: Array(2).fill('9b6f8d9a-b81d-4c49-b74d-1d9c18d36be2') },
  ])('TC-753: từ chối body sai %j', async (body) => {
    const t = fixture();
    expect((await t.request('/api/me/legal-acceptances', 'POST', body)).status).toBe(422);
    expect(t.legal.accept).not.toHaveBeenCalled();
  });
  it('TC-753: yêu cầu phiên và CSRF trước ghi', async () => {
    const t = fixture();
    expect((await t.request('/api/me/legal-acceptances', 'POST', {}, '', false)).status).toBe(401);
    expect((await t.request('/api/me/legal-acceptances', 'POST', {}, 'sai')).status).toBe(403);
    expect(t.legal.accept).not.toHaveBeenCalled();
  });
});
