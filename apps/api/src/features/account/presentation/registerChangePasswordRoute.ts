import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import { changeLocalPassword } from '../application/changeLocalPassword.js';
import type { ChangeLocalPasswordDeps } from '../application/ports.js';
import { changePasswordRoute } from './changePasswordRoute.js';

type Deps = ChangeLocalPasswordDeps & { clientIp: ClientIpResolver; logger: Pick<Logger, 'warn'> };
export function registerChangePasswordRoute(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  app.use(changePasswordRoute.path, async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(changePasswordRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const result = await changeLocalPassword(deps, {
      ...c.req.valid('json'),
      accountId: session.account.id,
      sessionId: session.sessionId,
      passwordChangeRequired: session.passwordChangeRequired,
      ip: deps.clientIp(c),
    });
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') c.header('Retry-After', String(result.retryAfterSeconds));
      if (result.code === 'ERR_AUTH_UNAVAILABLE')
        deps.logger.warn({ reason: result.reason }, 'Đổi mật khẩu tạm gián đoạn');
      return c.json(...errorJson(result.code, 'details' in result ? result.details : undefined));
    }
    return c.body(null, 204);
  });
}
