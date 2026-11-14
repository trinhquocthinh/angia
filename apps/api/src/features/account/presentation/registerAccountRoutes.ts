import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { rateLimitByIp } from '@src/shared/rateLimit/presentation/rateLimitByIp.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ClientIpResolver } from '@src/shared/rateLimit/application/ClientIpResolver.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Logger } from 'pino';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import type { CookieSettings } from '@src/shared/auth/presentation/pendingLoginCookie.js';
import { writeSessionCookie } from '@src/shared/auth/presentation/sessionCookie.js';
import { registerChangePasswordRoute } from './registerChangePasswordRoute.js';
import { loginLocalAccount } from '../application/loginLocalAccount.js';
import { registerLocalAccount } from '../application/registerLocalAccount.js';
import type {
  ChangeLocalPasswordDeps,
  LoginLocalAccountDeps,
  RegisterLocalAccountDeps,
} from '../application/ports.js';
import { passwordLoginRoute, registerAccountRoute } from './registerAccountRouteDefinitions.js';

type AccountRouteDeps = RegisterLocalAccountDeps &
  LoginLocalAccountDeps &
  ChangeLocalPasswordDeps & {
    appBaseUrl: string;
    cookies: CookieSettings;
    rateLimit: RateLimitDependencies;
    clientIp: ClientIpResolver;
    logger: Pick<Logger, 'warn'>;
  };

export function registerAccountRoutes(app: OpenAPIHono<AppEnv>, deps: AccountRouteDeps): void {
  registerPasswordLogin(app, deps);
  registerChangePasswordRoute(app, deps);
  requireTrustedJson(app, registerAccountRoute.path, deps.appBaseUrl);
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

function requireTrustedJson(app: OpenAPIHono<AppEnv>, path: string, appBaseUrl: string): void {
  const origin = new URL(appBaseUrl).origin;
  // Trước validator: body sai không bỏ qua kiểm Origin/JSON, không tiêu lượt.
  app.use(path, async (c, next) => {
    c.header('Cache-Control', 'no-store');
    const mediaType = c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase();
    if (c.req.header('Origin') !== origin || mediaType !== 'application/json') {
      return errorResponse(c, 'ERR_FORBIDDEN');
    }
    await next();
  });
}

function registerPasswordLogin(app: OpenAPIHono<AppEnv>, deps: AccountRouteDeps): void {
  requireTrustedJson(app, passwordLoginRoute.path, deps.appBaseUrl);
  app.openapi(passwordLoginRoute, async (c) => {
    const result = await loginLocalAccount(deps, { ...c.req.valid('json'), ip: deps.clientIp(c) });
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') {
        c.header('Retry-After', String(result.retryAfterSeconds));
      }
      if (result.code === 'ERR_AUTH_UNAVAILABLE') {
        deps.logger.warn({ reason: result.reason }, 'Đăng nhập local tạm gián đoạn');
      }
      c.header('Set-Cookie', undefined);
      return c.json(...errorJson(result.code));
    }
    const { session } = result;
    await writeSessionCookie(c, session, deps.cookies);
    return c.json(
      {
        session: {
          csrfToken: session.csrfToken,
          expiresAt: session.expiresAt.toISOString(),
          passwordChangeRequired: session.passwordChangeRequired,
        },
      },
      200,
    );
  });
}
