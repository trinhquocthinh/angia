import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppDependencies } from '@src/createApp.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { registerAsNeededDoseRoutes } from '@src/features/asNeededDoses/presentation/registerAsNeededDoseRoutes.js';
import { registerDoseConfirmationRoutes } from '@src/features/doseConfirmations/presentation/registerDoseConfirmationRoutes.js';
import { registerPrescriptionRoutes } from '@src/features/prescriptions/presentation/registerPrescriptionRoutes.js';
import { registerSelfProfileRoutes } from '@src/features/selfProfile/presentation/registerSelfProfileRoutes.js';
import { registerTemperatureRoutes } from '@src/features/temperatures/presentation/registerTemperatureRoutes.js';
import { registerTimelineRoutes } from '@src/features/timeline/presentation/registerTimelineRoutes.js';

// Nhóm route lịch sử và nhật ký dùng thuốc tại composition root để createApp giữ giới hạn kích thước.
export function registerHistoryRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: Pick<
    AppDependencies,
    | 'prescriptionChain'
    | 'revisits'
    | 'timeline'
    | 'selfProfile'
    | 'doseConfirmations'
    | 'asNeededDoses'
    | 'temperatures'
  >,
  now: () => Date,
): void {
  registerPrescriptionRoutes(app, deps, now);
  registerTimelineRoutes(app, deps.timeline, now);
  registerSelfProfileRoutes(app, deps.selfProfile, now);
  registerDoseConfirmationRoutes(app, deps.doseConfirmations, now);
  registerAsNeededDoseRoutes(app, deps.asNeededDoses, now);
  registerTemperatureRoutes(app, deps.temperatures, now);
}
