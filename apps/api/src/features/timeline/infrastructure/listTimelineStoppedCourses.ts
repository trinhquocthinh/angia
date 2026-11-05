import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

export function listTimelineStoppedCourses(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'course_stopped',
    sql`
    SELECT c.id::text, c.end_date + 1 AS date, NULL::text AS time,
      jsonb_build_object('courseId',c.id,'name',c.name) AS data
    FROM medication_courses c WHERE c.family_id=${scope.familyId} AND c.health_profile_id=${scope.profileId}
      AND c.status='stopped' AND (c.source='self_reported' OR EXISTS (
        SELECT 1 FROM prescription_items i JOIN prescriptions p ON p.id=i.prescription_id
        WHERE i.id=c.prescription_item_id AND i.family_id=${scope.familyId}
          AND p.family_id=${scope.familyId} AND p.health_profile_id=${scope.profileId}
          AND (${approvedTimelineRecord(scope, 'p')})
      ))
  `,
  );
}
