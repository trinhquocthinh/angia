import { OpenAPIHono } from '@hono/zod-openapi';
import { except } from 'hono/combine';
import type { HealthProbes } from '@src/features/health/application/ports.js';
import { registerHealthRoute } from '@src/features/health/presentation/registerHealthRoute.js';
import { loadSession } from '@src/shared/auth/presentation/loadSession.js';
import { type AuthRouteDeps, registerAuthRoutes } from '@src/shared/auth/presentation/registerAuthRoutes.js';
import { registerMeRoute } from '@src/shared/auth/presentation/registerMeRoute.js';
import { requireSession } from '@src/shared/auth/presentation/requireSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

export type AppDependencies = {
  healthProbes: HealthProbes;
  auth: AuthRouteDeps;
};

// Ngoại lệ duy nhất của "mọi route /api cần phiên" (Tech Spec §4); logout vẫn cần phiên + CSRF.
const PUBLIC_PATHS = ['/api/health', '/api/auth/login', '/api/auth/callback'];

// Lắp ráp route từ các adapter đã khởi tạo; tách khỏi server.ts để test in-process qua app.request().
export function createApp(deps: AppDependencies): OpenAPIHono<AppEnv> {
  const app = new OpenAPIHono<AppEnv>();
  const cookies = { secret: deps.auth.cookieSecret, secure: deps.auth.secureCookies };
  app.onError((error, c) => {
    deps.auth.logger.error({ reason: error.message }, 'Lỗi chưa xử lý');
    return errorResponse(c, 'ERR_INTERNAL');
  });
  app.use('/api/*', loadSession(deps.auth.login, cookies));
  app.use('/api/*', except(PUBLIC_PATHS, requireSession()));
  registerHealthRoute(app, deps.healthProbes);
  registerAuthRoutes(app, deps.auth);
  registerMeRoute(app);
  return app;
}
