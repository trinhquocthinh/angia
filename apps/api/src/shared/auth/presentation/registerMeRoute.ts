import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { errorResponseSchema, type MeContextResponse, meContextResponseSchema } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { LocalCredentialLookup } from '../application/ports.js';
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

type MeFeatures = MeContextResponse['features'];

function toMeContextResponse(
  session: SessionContext,
  features: MeFeatures,
  accountContext: Awaited<ReturnType<LocalCredentialLookup>>,
): MeContextResponse {
  return {
    account: session.account,
    family: session.family ? { ...session.family, isOwner: accountContext.isOwner } : null,
    role: session.role,
    csrfToken: session.csrfToken,
    authMethod: session.authMethod,
    hasLocalCredential: accountContext.hasLocalCredential,
    emailStatus: {
      email: accountContext.email,
      emailVerified: accountContext.emailVerified,
      pendingEmail: accountContext.pendingEmail,
    },
    features,
  };
}

// Phiên đã được loadSession + requireSession kiểm tra trước khi tới handler.
export function registerMeRoute(
  app: OpenAPIHono<AppEnv>,
  deps: { features: MeFeatures; lookupLocalCredential: LocalCredentialLookup },
): void {
  app.openapi(meRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    const accountContext = await deps.lookupLocalCredential(session.account.id);
    return c.json(toMeContextResponse(session, deps.features, accountContext), 200);
  });
}
