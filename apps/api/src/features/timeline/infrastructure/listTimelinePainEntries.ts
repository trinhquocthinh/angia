import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';

// BR-064: sổ đau nhức là dữ liệu tự ghi nhận, không qua duyệt và không ẩn theo BR-049.
export function listTimelinePainEntries(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'pain_entry',
    sql`
    SELECT e.id::text, (e.recorded_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS date,
      to_char(e.recorded_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') AS time,
      jsonb_build_object('issueId', i.id, 'region', i.region, 'side', i.side,
        'level', e.level, 'note', e.note) AS data
    FROM pain_entries e
    JOIN pain_issues i ON i.id=e.pain_issue_id
      AND i.family_id=${scope.familyId} AND i.health_profile_id=${scope.profileId}
    WHERE e.family_id=${scope.familyId} AND e.health_profile_id=${scope.profileId}
  `,
  );
}
