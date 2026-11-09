import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { PainJournalRouteDependencies } from './painJournalDependencies.js';
import { registerPainIssueReadRoutes } from './registerPainIssueReadRoutes.js';
import { registerPainIssueWriteRoutes } from './registerPainIssueWriteRoutes.js';
import { registerPainEntryRoutes } from './registerPainEntryRoutes.js';
import { registerPainExerciseRoutes } from './registerPainExerciseRoutes.js';

export function registerPainJournalRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PainJournalRouteDependencies,
): void {
  for (const self of [false, true]) {
    registerPainIssueReadRoutes(app, deps, self);
    registerPainIssueWriteRoutes(app, deps, self);
    registerPainEntryRoutes(app, deps, self);
    registerPainExerciseRoutes(app, deps, self);
  }
}
