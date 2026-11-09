import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';

export function listTimelinePainIssueStatuses(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'pain_issue_status',
    sql`
    SELECT s.id::text, s.on_date AS date, NULL::text AS time,
      jsonb_build_object('issueId', i.id, 'region', i.region, 'side', i.side, 'change', s.kind) AS data
    FROM pain_issue_status_events s
    JOIN pain_issues i ON i.id=s.pain_issue_id
      AND i.family_id=${scope.familyId} AND i.health_profile_id=${scope.profileId}
    WHERE s.family_id=${scope.familyId} AND s.health_profile_id=${scope.profileId}
  `,
  );
}
