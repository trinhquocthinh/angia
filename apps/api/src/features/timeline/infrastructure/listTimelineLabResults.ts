import { sql } from 'drizzle-orm';
import type { TimelineSourceQuery } from '../application/ports.js';
import { queryTimelineSource, type TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

export function listTimelineLabResults(scope: TimelineScope, query: TimelineSourceQuery) {
  return queryTimelineSource(
    scope,
    query,
    'lab_result',
    sql`
    SELECT COALESCE(l.source_document_id::text,min(l.id::text)) AS id,
      min(l.result_date) AS date, NULL::text AS time,
      jsonb_build_object('groupId',COALESCE(l.source_document_id::text,min(l.id::text)),
        'facility',(array_agg(l.facility ORDER BY l.created_at,l.id))[1],
        'results',jsonb_agg(jsonb_build_object(
          'id',l.id,'healthProfileId',l.health_profile_id,'sourceDocumentId',l.source_document_id,
          'resultDate',l.result_date,'testName',l.test_name,'value',l.value,'unit',l.unit,
          'referenceRange',l.reference_range,'facility',l.facility,'manualWithoutSource',l.manual_without_source,
          'createdAt',to_char(l.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ) ORDER BY l.created_at,l.id)) AS data
    FROM lab_results l WHERE l.family_id=${scope.familyId} AND l.health_profile_id=${scope.profileId}
      AND (${approvedTimelineRecord(scope, 'l')})
    GROUP BY l.source_document_id,
      CASE WHEN l.source_document_id IS NULL THEN l.result_date END,
      CASE WHEN l.source_document_id IS NULL THEN l.created_at END
  `,
  );
}
