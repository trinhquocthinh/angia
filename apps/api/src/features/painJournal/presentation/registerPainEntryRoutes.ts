import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import {
  createPainEntryRequestSchema,
  painEntrySchema,
  updatePainEntryRequestSchema,
} from '@angia/contracts';
import { createPainEntry } from '../application/createPainEntry.js';
import { updatePainEntry } from '../application/updatePainEntry.js';
import { deletePainEntry } from '../application/deletePainEntry.js';
import type { PainJournalRouteDependencies } from './painJournalDependencies.js';
import { registerPainRoute } from './registerPainRoute.js';
import { painJournalHandler } from './painJournalHandler.js';
export function registerPainEntryRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PainJournalRouteDependencies,
  self: boolean,
): void {
  const base = self ? '/api/me/profile/pain-issues' : '/api/health-profiles/{id}/pain-issues';
  registerPainRoute(
    app,
    'post',
    `${base}/{issueId}/entries`,
    { body: createPainEntryRequestSchema },
    201,
    painEntrySchema,
    painJournalHandler(deps, self, 201, ({ repository, target, body, now }) =>
      createPainEntry(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'patch',
    `${base}/{issueId}/entries/{entryId}`,
    { body: updatePainEntryRequestSchema },
    200,
    painEntrySchema,
    painJournalHandler(deps, self, 200, ({ repository, target, body, now }) =>
      updatePainEntry(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'delete',
    `${base}/{issueId}/entries/{entryId}`,
    {},
    204,
    undefined,
    painJournalHandler(deps, self, 204, ({ repository, target }) => deletePainEntry(repository, target)),
  );
}
