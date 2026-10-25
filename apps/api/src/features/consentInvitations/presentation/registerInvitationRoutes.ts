import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import type { InvitationDependencies } from '../application/ports.js';
import { createInvitation } from '../application/createInvitation.js';
import { revokeInvitation } from '../application/revokeInvitation.js';
import { viewInvitation } from '../application/viewInvitation.js';
import { respondToInvitation } from '../application/respondToInvitation.js';
import {
  createInvitationRoute,
  revokeInvitationRoute,
  viewInvitationRoute,
  respondInvitationRoute,
} from './invitationRouteDefinitions.js';

export interface InvitationRouteDependencies extends InvitationDependencies {
  appBaseUrl: string;
}
export function registerInvitationRoutes(app: OpenAPIHono<AppEnv>, deps: InvitationRouteDependencies): void {
  app.openAPIRegistry.registerComponent('securitySchemes', 'invitationToken', {
    type: 'http',
    scheme: 'bearer',
  });
  for (const path of ['/api/consent-invitations/view', '/api/consent-invitations/respond']) {
    app.use(path, async (c, next) => {
      c.header('Cache-Control', 'no-store');
      c.header('Referrer-Policy', 'no-referrer');
      await next();
    });
  }
  app.use('/api/consent-invitations/respond', async (c, next) => {
    if (c.req.method === 'POST' && c.req.header('origin') !== new URL(deps.appBaseUrl).origin)
      return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(createInvitationRoute, async (c) => {
    const session = c.get('session')!;
    const result = await createInvitation(
      deps,
      session.family!.id,
      c.req.valid('param').id,
      session.account.id,
    );
    return result.ok
      ? c.json({ ...result.value, expiresAt: result.value.expiresAt.toISOString() }, 201)
      : c.json(...errorJson(result.code));
  });
  app.openapi(revokeInvitationRoute, async (c) => {
    const result = await revokeInvitation(deps, c.get('session')!.family!.id, c.req.valid('param').id);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(viewInvitationRoute, async (c) => {
    const result = await viewInvitation(deps, bearerToken(c.req.header('authorization')));
    if (!result.ok) return c.json(...errorJson('ERR_NOT_FOUND'));
    return c.json({ ...result.value, expiresAt: result.value.expiresAt.toISOString() }, 200);
  });
  app.openapi(respondInvitationRoute, async (c) => {
    const result = await respondToInvitation(
      deps,
      bearerToken(c.req.header('authorization')),
      c.req.valid('json'),
    );
    if (!result.ok) return c.json(...errorJson('ERR_NOT_FOUND'));
    return c.json({ ...result.value, respondedAt: result.value.respondedAt.toISOString() }, 200);
  });
}
function bearerToken(header: string | undefined): string {
  return header?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1] ?? '';
}
