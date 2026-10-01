import { OpenAPIHono } from '@hono/zod-openapi';
import type { HealthProbes } from '@src/features/health/application/ports.js';
import { registerHealthRoute } from '@src/features/health/presentation/registerHealthRoute.js';

export type AppDependencies = {
  healthProbes: HealthProbes;
};

// Lắp ráp route từ các adapter đã khởi tạo; tách khỏi server.ts để test in-process qua app.request().
export function createApp(deps: AppDependencies): OpenAPIHono {
  const app = new OpenAPIHono();
  registerHealthRoute(app, deps.healthProbes);
  return app;
}
