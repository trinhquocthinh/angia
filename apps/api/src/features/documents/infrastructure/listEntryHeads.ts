import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { EntryHeadQuery } from '../application/documentEntryPorts.js';
import type { DocumentEntryHead } from '../domain/DocumentEntry.js';

interface EntryRow extends Record<string, unknown> {
  id: string;
  origin: DocumentEntryHead['origin'];
  type: DocumentEntryHead['type'];
  status: DocumentEntryHead['status'];
  entry_date: string;
  date_known: boolean;
  created_at: Date;
  created_key: string;
  has_image: boolean;
}

// SPEC-028: gộp chứng từ của hồ sơ, đơn nhập trực tiếp và phiếu XN nhập trực tiếp (các dòng cùng
// lần lưu có chung created_at của transaction). Chứng từ chưa có ngày lấy ngày tải lên giờ Việt Nam.
// Keyset theo giá trị (entry_date, created_at, id) nên cursor của mục đã xóa vẫn cho trang kế đúng.
export async function listEntryHeads(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  { type, take, after }: EntryHeadQuery,
): Promise<DocumentEntryHead[]> {
  const afterCondition = after
    ? sql`(entry_date, created_at, id) < (${after.entryDate}::date, ${after.createdKey}::timestamptz, ${after.id}::uuid)`
    : sql`true`;
  const result = await tx.execute<EntryRow>(sql`
    WITH entries AS (
      SELECT d.id, 'document' AS origin, d.type, d.status,
        COALESCE(d.document_date, (d.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS entry_date,
        d.document_date IS NOT NULL AS date_known, d.created_at, d.image_key IS NOT NULL AS has_image
      FROM source_documents d
      WHERE d.family_id = ${familyId} AND d.health_profile_id = ${profileId}
      UNION ALL
      SELECT p.id, 'manual', 'prescription', 'manual_record', p.issued_date, true, p.created_at, false
      FROM prescriptions p
      WHERE p.family_id = ${familyId} AND p.health_profile_id = ${profileId} AND p.source_document_id IS NULL
      UNION ALL
      SELECT min(l.id::text)::uuid, 'manual', 'lab_result', 'manual_record', l.result_date, true, l.created_at, false
      FROM lab_results l
      WHERE l.family_id = ${familyId} AND l.health_profile_id = ${profileId} AND l.source_document_id IS NULL
      GROUP BY l.result_date, l.created_at
    )
    SELECT id, origin, type, status, entry_date::text AS entry_date, date_known, created_at,
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_key, has_image
    FROM entries
    WHERE (${type ?? null}::text IS NULL OR type = ${type ?? null}) AND ${afterCondition}
    ORDER BY entry_date DESC, created_at DESC, id DESC
    LIMIT ${take}`);
  return result.rows.map((row) => ({
    id: row.id,
    origin: row.origin,
    type: row.type,
    status: row.status,
    entryDate: row.entry_date,
    dateKnown: row.date_known,
    createdAt: new Date(row.created_at),
    createdKey: row.created_key,
    hasImage: row.has_image,
  }));
}
