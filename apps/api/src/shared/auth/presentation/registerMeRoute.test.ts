import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import { requirePasswordChanged } from './requirePasswordChanged.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '../domain/SessionContext.js';
import { registerMeRoute } from './registerMeRoute.js';

const session: SessionContext = {
  authMethod: 'oidc',
  oidcAuthTime: null,
  passwordChangeRequired: false,
  sessionId: 's1',
  csrfToken: 'csrf',
  expiresAt: new Date('2026-12-01T00:00:00Z'),
  account: {
    id: '00000000-0000-4000-8000-000000000001',
    displayName: 'Mẹ',
    isSystemAdmin: false,
    healthProfileId: null,
  },
  family: null,
  role: null,
};

async function meWith(
  redactionSuggestions: boolean,
  hasLocalCredential = false,
  localEnrollmentEnabled = false,
  emailStatus = { email: null as string | null, emailVerified: false, pendingEmail: null as string | null },
) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('session', session);
    await next();
  });
  registerMeRoute(app, {
    features: { redactionSuggestions, localEnrollmentEnabled },
    lookupLocalCredential: async (accountId) => {
      expect(accountId).toBe(session.account.id);
      return { hasLocalCredential, ...emailStatus };
    },
  });
  return (await app.request('/api/me')).json();
}

describe('GET /api/me — cờ tính năng (SPEC-083)', () => {
  it('TC-890: features.redactionSuggestions theo cấu hình OCR_MASK_URL', async () => {
    expect(await meWith(true)).toMatchObject({ features: { redactionSuggestions: true } });
    expect(await meWith(false)).toMatchObject({ features: { redactionSuggestions: false } });
  });
});

describe('GET /api/me — điều kiện enrollment local', () => {
  it('TC-900: trả nguồn OIDC, credential và cờ enrollment bật/tắt', async () => {
    expect(await meWith(false, false, true)).toMatchObject({
      authMethod: 'oidc',
      hasLocalCredential: false,
      features: { localEnrollmentEnabled: true },
    });
    expect(await meWith(false, true, false)).toMatchObject({
      authMethod: 'oidc',
      hasLocalCredential: true,
      features: { localEnrollmentEnabled: false },
    });
  });
});

describe('GET /api/me — trạng thái email (SPEC-085)', () => {
  it.each([
    { label: 'chưa có email', email: null, emailVerified: false, pendingEmail: null },
    { label: 'có email chưa xác minh', email: 'lan@example.test', emailVerified: false, pendingEmail: null },
    {
      label: 'đã xác minh và đang đổi email',
      email: 'lan@example.test',
      emailVerified: true,
      pendingEmail: 'new@example.test',
    },
  ])('trả emailStatus khi $label', async ({ label: _label, ...emailStatus }) => {
    expect(await meWith(false, true, false, emailStatus)).toMatchObject({ emailStatus });
  });

  it('phiên hạn chế vẫn bị từ chối 403 trước khi đọc trạng thái email', async () => {
    const app = new OpenAPIHono<AppEnv>();
    app.use('*', async (c, next) => {
      c.set('session', { ...session, passwordChangeRequired: true });
      await next();
    });
    app.use('*', requirePasswordChanged());
    registerMeRoute(app, {
      features: { redactionSuggestions: false, localEnrollmentEnabled: false },
      lookupLocalCredential: async () => {
        throw new Error('Không được đọc trạng thái email');
      },
    });
    const response = await app.request('/api/me');
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED' } });
  });
});
