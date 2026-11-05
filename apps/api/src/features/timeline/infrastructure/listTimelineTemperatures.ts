import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';

export function listTimelineTemperatures(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'temperature',
    sql`
    SELECT t.id::text, (t.measured_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS date,
      to_char(t.measured_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') AS time,
      jsonb_build_object('celsius', t.celsius) AS data
    FROM temperature_readings t
    WHERE t.family_id=${scope.familyId} AND t.health_profile_id=${scope.profileId}
  `,
  );
}
