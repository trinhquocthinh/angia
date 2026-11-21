import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { changeAccountEmail } from '../application/changeAccountEmail.js';
import { requestEmailVerification } from '../application/requestEmailVerification.js';
import { confirmEmailVerification } from '../application/confirmEmailVerification.js';
import type { AccountEmailDeps } from '../application/ports.js';
import { requireTrustedJson } from './requireTrustedJson.js';
import {
  changeAccountEmailRoute,
  requestEmailVerificationRoute,
  confirmEmailVerificationRoute,
} from './emailRouteDefinitions.js';

type Deps = AccountEmailDeps & { appBaseUrl: string; clientIp: ClientIpResolver };
export function registerEmailRoutes(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  for (const route of [changeAccountEmailRoute, requestEmailVerificationRoute]) {
    app.use(route.path, async (c, next) => {
      c.header('Cache-Control', 'no-store');
      await next();
    });
  }
  registerEmailChange(app, deps);
  registerVerificationRequest(app, deps);
  registerVerificationConfirmation(app, deps);
}

function registerEmailChange(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  app.openapi(changeAccountEmailRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const result = await changeAccountEmail(deps, {
      ...c.req.valid('json'),
      accountId: session.account.id,
      sessionId: session.sessionId,
      ip: deps.clientIp(c),
    });
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') c.header('Retry-After', String(result.retryAfterSeconds));
      return c.json(...errorJson(result.code, 'details' in result ? result.details : undefined));
    }
    return c.json(result.value, 200);
  });
}

function registerVerificationRequest(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  app.openapi(requestEmailVerificationRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const result = await requestEmailVerification(deps, session.account.id);
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') c.header('Retry-After', String(result.retryAfterSeconds));
      return c.json(...errorJson(result.code));
    }
    return result.sent ? c.json({ sent: true as const }, 202) : c.body(null, 204);
  });
}

function registerVerificationConfirmation(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  requireTrustedJson(app, confirmEmailVerificationRoute.path, deps.appBaseUrl);
  app.openapi(confirmEmailVerificationRoute, async (c) => {
    const result = await confirmEmailVerification(deps, c.req.valid('json').token);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
}
