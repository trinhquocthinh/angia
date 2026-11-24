import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import type { CookieSettings } from '@src/shared/auth/presentation/pendingLoginCookie.js';
import { clearSessionCookie } from '@src/shared/auth/presentation/sessionCookie.js';
import { clearPushDevice } from '@src/shared/auth/presentation/pushDeviceCookie.js';
import { deleteAccount } from '../application/deleteAccount.js';
import type { AccountDeletionDeps } from '../application/deletionPorts.js';
import { accountDeletionRoute } from './accountDeletionRoute.js';
import { requireTrustedJson } from './requireTrustedJson.js';

export type AccountDeletionRouteDeps = AccountDeletionDeps & {
  clientIp: ClientIpResolver;
  appBaseUrl: string;
  cookies: CookieSettings;
};
export function registerAccountDeletionRoute(app: OpenAPIHono<AppEnv>, deps: AccountDeletionRouteDeps): void {
  requireTrustedJson(app, accountDeletionRoute.path, deps.appBaseUrl);
  app.openapi(accountDeletionRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const result = await deleteAccount(deps, {
      ...c.req.valid('json'),
      accountId: session.account.id,
      ip: deps.clientIp(c),
    });
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') c.header('Retry-After', String(result.retryAfterSeconds));
      if (result.code === 'ERR_AUTH_UNAVAILABLE')
        deps.logger.warn({ reason: result.reason }, 'Xoá tài khoản tạm gián đoạn');
      return c.json(...errorJson(result.code, 'details' in result ? result.details : undefined));
    }
    clearSessionCookie(c, deps.cookies);
    clearPushDevice(c, deps.cookies);
    return c.body(null, 204);
  });
}
