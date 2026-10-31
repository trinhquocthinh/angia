import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

export function listTimelineRevisits(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'revisit',
    sql`
    SELECT p.revisit_date::text AS id, p.revisit_date AS date, NULL::text AS time,
      jsonb_build_object('prescriptionIds',jsonb_agg(p.id ORDER BY p.issued_date,p.created_at,p.id)) AS data
    FROM prescriptions p WHERE p.family_id=${scope.familyId} AND p.health_profile_id=${scope.profileId}
      AND p.revisit_date IS NOT NULL AND (${approvedTimelineRecord(scope, 'p')})
    GROUP BY p.revisit_date
  `,
  );
}
