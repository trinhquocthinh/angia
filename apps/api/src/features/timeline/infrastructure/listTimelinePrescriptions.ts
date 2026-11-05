import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

export function listTimelinePrescriptions(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'prescription',
    sql`
    SELECT p.id::text, p.issued_date AS date, NULL::text AS time,
      jsonb_build_object('prescriptionId',p.id,'facility',p.facility,'diagnosis',p.diagnosis,
        'itemCount',(SELECT count(*) FROM prescription_items i WHERE i.prescription_id=p.id
          AND i.family_id=${scope.familyId}), 'diffSummary',NULL) AS data
    FROM prescriptions p WHERE p.family_id=${scope.familyId} AND p.health_profile_id=${scope.profileId}
      AND (${approvedTimelineRecord(scope, 'p')})
  `,
  );
}
