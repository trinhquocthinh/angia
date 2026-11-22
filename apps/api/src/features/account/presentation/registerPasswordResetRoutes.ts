import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import type { EmailPasswordResetDeps } from '../application/passwordResetPorts.js';
import { requestPasswordReset } from '../application/requestPasswordReset.js';
import { resetPasswordByEmail } from '../application/resetPasswordByEmail.js';
import { requireTrustedJson } from './requireTrustedJson.js';
import { requestPasswordResetRoute, resetPasswordRoute } from './passwordResetRouteDefinitions.js';

type Deps = EmailPasswordResetDeps & {
  appBaseUrl: string;
  clientIp: ClientIpResolver;
  logger: Pick<Logger, 'warn'>;
};
export function registerPasswordResetRoutes(app: OpenAPIHono<AppEnv>, deps: Deps): void {
  for (const route of [requestPasswordResetRoute, resetPasswordRoute]) {
    requireTrustedJson(app, route.path, deps.appBaseUrl);
    app.use(route.path, async (c, next) => {
      c.header('Cache-Control', 'no-store');
      await next();
    });
  }
  const runInBackground =
    deps.runInBackground ??
    ((task: () => Promise<void>) => {
      void Promise.resolve()
        .then(task)
        .catch((error: unknown) => {
          deps.logger.warn(
            { err: error instanceof Error ? error.name : 'unknown' },
            'Yêu cầu đặt lại mật khẩu nền thất bại',
          );
        });
    });
  app.openapi(requestPasswordResetRoute, async (c) => {
    const result = await requestPasswordReset(
      { ...deps, runInBackground },
      { ...c.req.valid('json'), ip: deps.clientIp(c) },
    );
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') c.header('Retry-After', String(result.retryAfterSeconds));
      if (result.code === 'ERR_AUTH_UNAVAILABLE')
        deps.logger.warn({ reason: result.reason }, 'Yêu cầu đặt lại mật khẩu tạm gián đoạn');
      return c.json(...errorJson(result.code));
    }
    return c.json({ received: true as const }, 202);
  });
  app.openapi(resetPasswordRoute, async (c) => {
    const result = await resetPasswordByEmail(deps, c.req.valid('json'));
    if (!result.ok && result.code === 'ERR_AUTH_UNAVAILABLE')
      deps.logger.warn({ reason: result.reason }, 'Đặt lại mật khẩu qua email tạm gián đoạn');
    if (!result.ok)
      return c.json(...errorJson(result.code, 'details' in result ? result.details : undefined));
    return c.body(null, 204);
  });
}
