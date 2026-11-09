import type { Target, Probe } from './CrossFamilyTarget.js';
import type { ProfileTestApp } from './startProfileTestApp.js';
const base = (x: Target) => `/api/health-profiles/${x.profileId}/pain-issues`;
export function painJournalRouteProbes(call: ProfileTestApp['call']) {
  return {
    'GET /api/health-profiles/:id/pain-issues': (u, x) => call(u, 'GET', `${base(x)}`),
    'POST /api/health-profiles/:id/pain-issues': (u, x) =>
      call(u, 'POST', `${base(x)}`, {
        region: 'knee',
        side: 'left',
        firstEntry: { level: 5 },
      }),
    'GET /api/health-profiles/:id/pain-issues/:issueId': (u, x) =>
      call(u, 'GET', `${base(x)}/${x.painIssueId}`),
    'GET /api/health-profiles/:id/pain-issues/:issueId/context': (u, x) =>
      call(u, 'GET', `${base(x)}/${x.painIssueId}/context`),
    'PATCH /api/health-profiles/:id/pain-issues/:issueId': (u, x) =>
      call(u, 'PATCH', `${base(x)}/${x.painIssueId}`, { title: 'Gối' }),
    'POST /api/health-profiles/:id/pain-issues/:issueId/resolve': (u, x) =>
      call(u, 'POST', `${base(x)}/${x.painIssueId}/resolve`, {
        resolvedOn: '2026-11-06',
      }),
    'POST /api/health-profiles/:id/pain-issues/:issueId/reopen': (u, x) =>
      call(u, 'POST', `${base(x)}/${x.painIssueId}/reopen`, {}),
    'GET /api/health-profiles/:id/pain-issues/:issueId/deletion-impact': (u, x) =>
      call(u, 'GET', `${base(x)}/${x.painIssueId}/deletion-impact`),
    'DELETE /api/health-profiles/:id/pain-issues/:issueId': (u, x) =>
      call(u, 'DELETE', `${base(x)}/${x.painIssueId}`, {
        confirm: true,
      }),
    'POST /api/health-profiles/:id/pain-issues/:issueId/entries': (u, x) =>
      call(u, 'POST', `${base(x)}/${x.painIssueId}/entries`, {
        level: 5,
      }),
    'PATCH /api/health-profiles/:id/pain-issues/:issueId/entries/:entryId': (u, x) =>
      call(u, 'PATCH', `${base(x)}/${x.painIssueId}/entries/${x.painEntryId}`, { level: 3 }),
    'DELETE /api/health-profiles/:id/pain-issues/:issueId/entries/:entryId': (u, x) =>
      call(u, 'DELETE', `${base(x)}/${x.painIssueId}/entries/${x.painEntryId}`),
    'POST /api/health-profiles/:id/pain-issues/:issueId/exercises': (u, x) =>
      call(u, 'POST', `${base(x)}/${x.painIssueId}/exercises`, {
        name: 'Duỗi gối',
        source: 'self',
        startDate: '2026-11-05',
      }),
    'PATCH /api/health-profiles/:id/pain-issues/:issueId/exercises/:exerciseId': (u, x) =>
      call(u, 'PATCH', `${base(x)}/${x.painIssueId}/exercises/${x.painExerciseId}`, { name: 'Co gối' }),
    'DELETE /api/health-profiles/:id/pain-issues/:issueId/exercises/:exerciseId': (u, x) =>
      call(u, 'DELETE', `${base(x)}/${x.painIssueId}/exercises/${x.painExerciseId}`),
  } satisfies Record<string, Probe>;
}
