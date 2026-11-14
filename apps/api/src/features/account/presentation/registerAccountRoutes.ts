import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { rateLimitByIp } from '@src/shared/rateLimit/presentation/rateLimitByIp.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import type { CookieSettings } from '@src/shared/auth/presentation/pendingLoginCookie.js';
import { writeSessionCookie } from '@src/shared/auth/presentation/sessionCookie.js';
import { registerLocalAccount } from '../application/registerLocalAccount.js';
import type { RegisterLocalAccountDeps } from '../application/ports.js';
import { registerAccountRoute } from './registerAccountRouteDefinitions.js';

export function registerAccountRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: RegisterLocalAccountDeps & {
    appBaseUrl: string;
    cookies: CookieSettings;
    rateLimit: RateLimitDependencies;
    clientIp: ClientIpResolver;
  },
): void {
  const origin = new URL(deps.appBaseUrl).origin;
  // Middleware đứng trước validator để body sai cũng không bỏ qua kiểm Origin/JSON.
  app.use(registerAccountRoute.path, async (c, next) => {
    c.header('Cache-Control', 'no-store');
    const mediaType = c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase();
    if (c.req.header('Origin') !== origin || mediaType !== 'application/json') {
      return errorResponse(c, 'ERR_FORBIDDEN');
    }
    await next();
  });
  app.use(
    registerAccountRoute.path,
    rateLimitByIp(deps.rateLimit, rateLimitPolicies.register, deps.clientIp),
  );
  app.openapi(registerAccountRoute, async (c) => {
    let result;
    try {
      result = await registerLocalAccount(deps, c.req.valid('json'));
    } catch (error) {
      if (error instanceof PasswordHashBusyError) {
        c.header('Set-Cookie', undefined);
        return c.json(...errorJson('ERR_AUTH_UNAVAILABLE'));
      }
      throw error;
    }
    if (!result.ok) {
      return c.json(...errorJson(result.code, 'details' in result ? result.details : undefined));
    }
    const { account, session } = result.value;
    await writeSessionCookie(c, session, deps.cookies);
    return c.json(
      {
        account,
        session: {
          csrfToken: session.csrfToken,
          expiresAt: session.expiresAt.toISOString(),
        },
      },
      201,
    );
  });
}
