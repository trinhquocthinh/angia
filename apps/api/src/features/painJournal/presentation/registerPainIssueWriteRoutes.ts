import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import {
  createPainIssueRequestSchema,
  deletePainIssueRequestSchema,
  painIssueDetailSchema,
  painIssueSummarySchema,
  reopenPainIssueRequestSchema,
  resolvePainIssueRequestSchema,
  updatePainIssueRequestSchema,
} from '@angia/contracts';
import { openPainIssue } from '../application/openPainIssue.js';
import { updatePainIssue } from '../application/updatePainIssue.js';
import { resolvePainIssue } from '../application/resolvePainIssue.js';
import { reopenPainIssue } from '../application/reopenPainIssue.js';
import { deletePainIssue } from '../application/deletePainIssue.js';
import type { PainJournalRouteDependencies } from './painJournalDependencies.js';
import { registerPainRoute } from './registerPainRoute.js';
import { painJournalHandler } from './painJournalHandler.js';
export function registerPainIssueWriteRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PainJournalRouteDependencies,
  self: boolean,
): void {
  const base = self ? '/api/me/profile/pain-issues' : '/api/health-profiles/{id}/pain-issues';
  registerPainRoute(
    app,
    'post',
    `${base}`,
    { body: createPainIssueRequestSchema },
    201,
    painIssueDetailSchema,
    painJournalHandler(deps, self, 201, ({ repository, target, body, now }) =>
      openPainIssue(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'patch',
    `${base}/{issueId}`,
    { body: updatePainIssueRequestSchema },
    200,
    painIssueSummarySchema,
    painJournalHandler(deps, self, 200, ({ repository, target, body, now }) =>
      updatePainIssue(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'post',
    `${base}/{issueId}/resolve`,
    { body: resolvePainIssueRequestSchema },
    200,
    painIssueSummarySchema,
    painJournalHandler(deps, self, 200, ({ repository, target, body, now }) =>
      resolvePainIssue(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'post',
    `${base}/{issueId}/reopen`,
    { body: reopenPainIssueRequestSchema },
    200,
    painIssueSummarySchema,
    painJournalHandler(deps, self, 200, ({ repository, target, body, now }) =>
      reopenPainIssue(repository, target, body, now),
    ),
  );
  registerPainRoute(
    app,
    'delete',
    `${base}/{issueId}`,
    { body: deletePainIssueRequestSchema },
    204,
    undefined,
    painJournalHandler(deps, self, 204, (r) => deletePainIssue(r.repository, r.target, r.body)),
  );
}
