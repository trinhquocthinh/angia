import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

export function listTimelineMeasurements(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'measurement',
    sql`
    SELECT m.id::text, m.measured_on AS date, m.measured_time AS time,
      jsonb_build_object('id',m.id,'healthProfileId',m.health_profile_id,'sourceDocumentId',m.source_document_id,
        'kind',CASE WHEN m.kind='blood_glucose' THEN 'glucose' ELSE m.kind END,
        'measuredOn',m.measured_on,'measuredTime',m.measured_time,
        'systolic',m.systolic,'diastolic',m.diastolic,'pulse',m.pulse,
        'glucoseValue',m.glucose_value,'glucoseUnit',m.glucose_unit,'manualWithoutSource',m.manual_without_source,
        'createdAt',to_char(m.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) AS data
    FROM measurements m WHERE m.family_id=${scope.familyId} AND m.health_profile_id=${scope.profileId}
      AND (${approvedTimelineRecord(scope, 'm')})
  `,
  );
}
