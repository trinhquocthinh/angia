import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppDependencies } from '@src/createApp.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { registerPrescriptionRoutes } from '@src/features/prescriptions/presentation/registerPrescriptionRoutes.js';
import { registerTimelineRoutes } from '@src/features/timeline/presentation/registerTimelineRoutes.js';

// Nhóm route đọc lịch sử tại composition root để createApp giữ giới hạn kích thước.
export function registerHistoryRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: Pick<AppDependencies, 'prescriptionChain' | 'revisits' | 'timeline'>,
  now: () => Date,
): void {
  registerPrescriptionRoutes(app, deps, now);
  registerTimelineRoutes(app, deps.timeline, now);
}
