import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';

export function listTimelineExercisesStarted(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'exercise_started',
    sql`
    SELECT x.id::text, x.start_date AS date, NULL::text AS time,
      jsonb_build_object('issueId', i.id, 'region', i.region, 'side', i.side,
        'exerciseId', x.id, 'name', x.name, 'source', x.source) AS data
    FROM exercise_notes x
    JOIN pain_issues i ON i.id=x.pain_issue_id
      AND i.family_id=${scope.familyId} AND i.health_profile_id=${scope.profileId}
    WHERE x.family_id=${scope.familyId} AND x.health_profile_id=${scope.profileId}
  `,
  );
}
