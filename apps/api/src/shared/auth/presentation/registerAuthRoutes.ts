import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import type { Logger } from 'pino';
import { completeLogin } from '../application/completeLogin.js';
import type { CompleteLoginDeps } from '../application/ports.js';
import { takePendingLogin, writePendingLogin } from './pendingLoginCookie.js';
import { writeSessionCookie } from './writeSessionCookie.js';

export interface AuthRouteDeps {
  login: CompleteLoginDeps;
  cookieSecret: string;
  secureCookies: boolean;
  logger: Pick<Logger, 'warn'>;
}

// Trang /login (E2-S1-T3) hiển thị trạng thái "Lỗi xác thực + Thử lại" khi có tham số này.
const LOGIN_FAILED_LOCATION = '/login?error=auth';

const redirectResponse = { 302: { description: 'Chuyển hướng' } } as const;

const loginRoute = createRoute({
  method: 'get',
  path: '/api/auth/login',
  tags: ['auth'],
  summary: 'Chuyển hướng sang Authentik (OIDC Code + PKCE S256)',
  responses: redirectResponse,
});

const callbackRoute = createRoute({
  method: 'get',
  path: '/api/auth/callback',
  tags: ['auth'],
  summary: 'Nhận code từ Authentik, tạo phiên và đặt cookie angia_session',
  responses: redirectResponse,
});

export function registerAuthRoutes(app: OpenAPIHono, deps: AuthRouteDeps): void {
  const cookies = { secret: deps.cookieSecret, secure: deps.secureCookies };

  app.openapi(loginRoute, async (c) => {
    const request = await deps.login.oidc.createAuthorizationRequest();
    await writePendingLogin(c, request.pending, cookies);
    c.header('Cache-Control', 'no-store');
    return c.redirect(request.url.toString(), 302);
  });

  app.openapi(callbackRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const pending = await takePendingLogin(c, cookies);
    if (!pending) {
      deps.logger.warn('Callback OIDC thiếu hoặc sai cookie PKCE');
      return c.redirect(LOGIN_FAILED_LOCATION, 302);
    }
    try {
      const params = new URL(c.req.url).searchParams;
      const session = await completeLogin(deps.login, params, pending);
      await writeSessionCookie(c, session, cookies);
      return c.redirect('/', 302);
    } catch (error) {
      // Chỉ ghi thông điệp lỗi, không ghi query (chứa code) hay token.
      deps.logger.warn(
        { reason: error instanceof Error ? error.message : 'unknown' },
        'Đăng nhập OIDC thất bại',
      );
      return c.redirect(LOGIN_FAILED_LOCATION, 302);
    }
  });
}
