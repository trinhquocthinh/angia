import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

export function listTimelineAsNeededDoses(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'as_needed_dose',
    sql`
    SELECT d.id::text, (d.given_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS date,
      to_char(d.given_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') AS time,
      jsonb_build_object('courseId', c.id, 'name', c.name, 'quantity', d.quantity, 'unit', d.unit) AS data
    FROM as_needed_doses d
    JOIN medication_courses c ON c.id=d.medication_course_id
      AND c.family_id=${scope.familyId} AND c.health_profile_id=${scope.profileId}
    JOIN prescription_items i ON i.id=c.prescription_item_id AND i.family_id=${scope.familyId}
    JOIN prescriptions p ON p.id=i.prescription_id
      AND p.family_id=${scope.familyId} AND p.health_profile_id=${scope.profileId}
    WHERE d.family_id=${scope.familyId} AND d.health_profile_id=${scope.profileId}
      AND (${approvedTimelineRecord(scope, 'p')})
  `,
  );
}
