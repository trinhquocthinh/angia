import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '../domain/SessionContext.js';
import { registerMeRoute } from './registerMeRoute.js';

const session: SessionContext = {
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

async function meWith(redactionSuggestions: boolean) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('session', session);
    await next();
  });
  registerMeRoute(app, { redactionSuggestions });
  return (await app.request('/api/me')).json();
}

describe('GET /api/me — cờ tính năng (SPEC-083)', () => {
  it('TC-890: features.redactionSuggestions theo cấu hình OCR_MASK_URL', async () => {
    expect(await meWith(true)).toMatchObject({ features: { redactionSuggestions: true } });
    expect(await meWith(false)).toMatchObject({ features: { redactionSuggestions: false } });
  });
});
