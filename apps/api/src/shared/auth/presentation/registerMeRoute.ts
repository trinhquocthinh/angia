import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { errorResponseSchema, type MeContextResponse, meContextResponseSchema } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '../domain/SessionContext.js';
import { currentSession } from './currentSession.js';

const meRoute = createRoute({
  method: 'get',
  path: '/api/me',
  tags: ['auth'],
  summary: 'Ngữ cảnh tài khoản, nhóm, vai trò và CSRF token của phiên hiện hành',
  responses: {
    200: {
      description: 'Phiên còn hạn; family/role null khi tài khoản chờ gán nhóm',
      content: { 'application/json': { schema: meContextResponseSchema } },
    },
    401: {
      description: 'ERR_UNAUTHENTICATED: thiếu phiên, phiên hết hạn hoặc cookie không hợp lệ',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

function toMeContextResponse(session: SessionContext): MeContextResponse {
  return {
    account: session.account,
    family: session.family,
    role: session.role,
    csrfToken: session.csrfToken,
  };
}

// Phiên đã được loadSession + requireSession kiểm tra trước khi tới handler.
export function registerMeRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(meRoute, (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(toMeContextResponse(currentSession(c)), 200);
  });
}
