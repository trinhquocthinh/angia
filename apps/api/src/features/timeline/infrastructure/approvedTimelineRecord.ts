import { sql, type SQL } from 'drizzle-orm';
import type { TimelineScope } from './queryTimelineSource.js';

// Các alias do mã nguồn cố định truyền vào; không nhận tên cột từ request.
export function approvedTimelineRecord({ familyId, profileId }: TimelineScope, alias: string): SQL {
  const row = sql.raw(alias);
  return sql`(${row}.source_document_id IS NULL AND ${row}.manual_without_source = true)
    OR EXISTS (SELECT 1 FROM source_documents d WHERE d.id = ${row}.source_document_id
      AND d.family_id = ${familyId} AND d.health_profile_id = ${profileId} AND d.status = 'approved')`;
}
