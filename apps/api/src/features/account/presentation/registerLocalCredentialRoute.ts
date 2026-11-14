import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { enrollLocalCredential } from '../application/enrollLocalCredential.js';
import type { EnrollLocalCredentialDeps } from '../application/ports.js';
import { localCredentialRoute } from './localCredentialRoute.js';

type Deps = EnrollLocalCredentialDeps & { logger: Pick<Logger, 'warn'> };

export function registerLocalCredentialRoute(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  app.openapi(localCredentialRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const result = await enrollLocalCredential(deps, {
      ...c.req.valid('json'),
      accountId: session.account.id,
      sessionId: session.sessionId,
      authMethod: session.authMethod,
      oidcAuthTime: session.oidcAuthTime,
    });
    if (!result.ok) {
      if (result.code === 'ERR_AUTH_UNAVAILABLE')
        deps.logger.warn({ reason: result.reason }, 'Thiết lập mật khẩu tạm gián đoạn');
      return c.json(...errorJson(result.code, 'details' in result ? result.details : undefined));
    }
    return c.body(null, 204);
  });
}
