import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import {
  painContextQuerySchema,
  painContextSchema,
  painIssueDeletionImpactSchema,
  painIssueDetailSchema,
  painIssueListSchema,
  painIssueQuerySchema,
} from '@angia/contracts';
import { listPainIssues } from '../application/listPainIssues.js';
import { getPainIssue } from '../application/getPainIssue.js';
import { getPainContext } from '../application/getPainContext.js';
import { getPainIssueDeletionImpact } from '../application/getPainIssueDeletionImpact.js';
import type { PainJournalRouteDependencies } from './painJournalDependencies.js';
import { registerPainRoute } from './registerPainRoute.js';
import { painJournalHandler } from './painJournalHandler.js';
export function registerPainIssueReadRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PainJournalRouteDependencies,
  self: boolean,
): void {
  const base = self ? '/api/me/profile/pain-issues' : '/api/health-profiles/{id}/pain-issues';
  registerPainRoute(
    app,
    'get',
    `${base}`,
    { query: painIssueQuerySchema },
    200,
    painIssueListSchema,
    painJournalHandler(deps, self, 200, ({ repository, target, query }) =>
      listPainIssues(repository, target, query),
    ),
  );
  registerPainRoute(
    app,
    'get',
    `${base}/{issueId}`,
    {},
    200,
    painIssueDetailSchema,
    painJournalHandler(deps, self, 200, ({ repository, target }) => getPainIssue(repository, target)),
  );
  registerPainRoute(
    app,
    'get',
    `${base}/{issueId}/context`,
    { query: painContextQuerySchema },
    200,
    painContextSchema,
    painJournalHandler(deps, self, 200, ({ repository, target, query, now }) =>
      getPainContext(repository, target, query, now),
    ),
  );
  registerPainRoute(
    app,
    'get',
    `${base}/{issueId}/deletion-impact`,
    {},
    200,
    painIssueDeletionImpactSchema,
    painJournalHandler(deps, self, 200, ({ repository, target }) =>
      getPainIssueDeletionImpact(repository, target),
    ),
  );
}
