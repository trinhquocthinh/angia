import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';

export function listTimelineAdherencePeriods(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'adherence_period',
    sql`
    SELECT a.id::text, a.from_date AS date, NULL::text AS time,
      jsonb_build_object('medicationName',a.medication_name,'status',a.status) AS data
    FROM adherence_periods a WHERE a.family_id=${scope.familyId} AND a.health_profile_id=${scope.profileId}
  `,
  );
}
