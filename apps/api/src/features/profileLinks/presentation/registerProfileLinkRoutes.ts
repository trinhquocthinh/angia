import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { registerInvitationRoutes } from '@src/features/consentInvitations/presentation/registerInvitationRoutes.js';
import { acceptProfileLink } from '../application/acceptProfileLink.js';
import { createProfileLink } from '../application/createProfileLink.js';
import type { ProfileLinkDependencies } from '../application/ports.js';
import { revokeProfileLink } from '../application/revokeProfileLink.js';
import { viewProfileLink } from '../application/viewProfileLink.js';
import { registerLinkManagementRoutes } from './registerLinkManagementRoutes.js';
import {
  acceptProfileLinkRoute,
  createProfileLinkRoute,
  revokeProfileLinkRoute,
  viewProfileLinkRoute,
} from './profileLinkRouteDefinitions.js';

export function registerProfileLinkRoutes(app: OpenAPIHono<AppEnv>, deps: ProfileLinkDependencies): void {
  app.openAPIRegistry.registerComponent('securitySchemes', 'profileLinkToken', {
    type: 'http',
    scheme: 'bearer',
  });
  // E14: thay thế link đồng thuận ẩn danh nên đường dẫn cũ nhận 410 từ cùng điểm đăng ký.
  registerInvitationRoutes(app);
  registerLinkManagementRoutes(app, deps);
  app.use('/api/me/link-invitations/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('Referrer-Policy', 'no-referrer');
    await next();
  });
  app.openapi(createProfileLinkRoute, async (c) => {
    const session = c.get('session')!;
    const result = await createProfileLink(
      deps,
      session.family!.id,
      c.req.valid('param').id,
      session.account.id,
    );
    return result.ok
      ? c.json({ url: result.value.url, expiresAt: result.value.expiresAt.toISOString() }, 201)
      : c.json(...errorJson(result.code));
  });
  app.openapi(revokeProfileLinkRoute, async (c) => {
    const result = await revokeProfileLink(deps, c.get('session')!.family!.id, c.req.valid('param').id);
    return result.ok ? c.body(null, 204) : c.json(...errorJson(result.code));
  });
  app.openapi(viewProfileLinkRoute, async (c) => {
    const session = c.get('session')!;
    // Tài khoản chờ gán nhóm không thể thuộc gia đình của link nên cùng 404 với token sai.
    if (!session.family) return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await viewProfileLink(
      deps,
      bearerToken(c.req.header('authorization')),
      session.account.id,
    );
    return result.ok
      ? c.json({ ...result.value, expiresAt: result.value.expiresAt.toISOString() }, 200)
      : c.json(...errorJson(result.code));
  });
  app.openapi(acceptProfileLinkRoute, async (c) => {
    const session = c.get('session')!;
    if (!session.family) return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await acceptProfileLink(
      deps,
      bearerToken(c.req.header('authorization')),
      session.account.id,
      c.req.valid('json').decision,
    );
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
}
function bearerToken(header: string | undefined): string {
  return header?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1] ?? '';
}
