import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { resetMemberPassword } from '../application/resetMemberPassword.js';
import type { ResetMemberPasswordDeps } from '../application/ports.js';
import { resetMemberPasswordRoute } from './resetMemberPasswordRoute.js';

type Deps = ResetMemberPasswordDeps & { logger: Pick<Logger, 'warn'> };
export function registerResetMemberPasswordRoute(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  app.use('/api/family/members/:targetAccountId/password-reset', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(resetMemberPasswordRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const result = await resetMemberPassword(
      deps,
      {
        accountId: session.account.id,
        familyId: session.family?.id ?? null,
        role: session.role,
      },
      c.req.valid('param').targetAccountId,
    );
    if (!result.ok) {
      if (result.code === 'ERR_AUTH_UNAVAILABLE')
        deps.logger.warn({ reason: result.reason }, 'Đặt lại mật khẩu tạm gián đoạn');
      return c.json(...errorJson(result.code));
    }
    return c.json(
      { temporaryPassword: result.value.temporaryPassword, expiresAt: result.value.expiresAt.toISOString() },
      200,
    );
  });
}
