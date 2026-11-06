import type { RouteOfKind } from './healthDataRoutes.js';
import type { expectSelfWriteDenied } from './expectSelfWriteDenied.js';
type Probe = Parameters<typeof expectSelfWriteDenied>[1];

export function selfPainJournalRouteProbes(
  probe: (method: string, suffix: string, body?: unknown) => Probe,
): Record<RouteOfKind<'self_write'>, Probe> {
  return {
    'POST /api/me/profile/pain-issues': probe('POST', '', {
      region: 'knee',
      side: 'right',
      firstEntry: { level: 4 },
    }),
    'PATCH /api/me/profile/pain-issues/:issueId': probe('PATCH', '/:issueId', { title: 'Gối trái' }),
    'POST /api/me/profile/pain-issues/:issueId/resolve': probe('POST', '/:issueId/resolve', {
      resolvedOn: '2026-11-06',
    }),
    'POST /api/me/profile/pain-issues/:issueId/reopen': probe('POST', '/:issueId/reopen', {}),
    'DELETE /api/me/profile/pain-issues/:issueId': probe('DELETE', '/:issueId', { confirm: true }),
    'POST /api/me/profile/pain-issues/:issueId/entries': probe('POST', '/:issueId/entries', { level: 3 }),
    'PATCH /api/me/profile/pain-issues/:issueId/entries/:entryId': probe(
      'PATCH',
      '/:issueId/entries/:entryId',
      { level: 2 },
    ),
    'DELETE /api/me/profile/pain-issues/:issueId/entries/:entryId': probe(
      'DELETE',
      '/:issueId/entries/:entryId',
    ),
    'POST /api/me/profile/pain-issues/:issueId/exercises': probe('POST', '/:issueId/exercises', {
      name: 'Duỗi gối',
      source: 'self',
      startDate: '2026-11-05',
    }),
    'PATCH /api/me/profile/pain-issues/:issueId/exercises/:exerciseId': probe(
      'PATCH',
      '/:issueId/exercises/:exerciseId',
      { name: 'Co gối' },
    ),
    'DELETE /api/me/profile/pain-issues/:issueId/exercises/:exerciseId': probe(
      'DELETE',
      '/:issueId/exercises/:exerciseId',
    ),
  } satisfies Record<RouteOfKind<'self_write'>, Probe>;
}
