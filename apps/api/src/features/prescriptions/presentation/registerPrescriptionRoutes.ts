import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { PrescriptionChainRepository } from '../application/prescriptionChainPorts.js';
import type { RevisitRepository } from '../application/revisitPorts.js';
import { registerPrescriptionChainRoutes } from './registerPrescriptionChainRoutes.js';
import { registerRevisitRoutes } from './registerRevisitRoutes.js';

export function registerPrescriptionRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: { prescriptionChain: PrescriptionChainRepository; revisits: RevisitRepository },
  now: () => Date,
): void {
  registerRevisitRoutes(app, deps.revisits, now);
  registerPrescriptionChainRoutes(app, deps.prescriptionChain);
}
