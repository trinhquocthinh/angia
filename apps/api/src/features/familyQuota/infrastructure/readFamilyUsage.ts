import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { UsageCounts } from '../domain/FamilyQuota.js';

interface UsageRow extends Record<string, unknown> {
  storage_bytes: string | number;
  uploads_today: number;
  pending_jobs: number;
}

// Job sanitize-document-image không có dead-letter: hết lượt (≈ 3 × 300 s + giãn cách) thì chứng từ kẹt ở uploaded.
// Quá mốc này không tính "chờ worker" để chứng từ kẹt không khóa gia đình mãi (SPEC-030, owner duyệt 2026-10-19).
const STUCK_UPLOAD_AFTER = '1 hour';

// SPEC-030: chỉ tính byte của ảnh còn tồn tại; tự nhập không chiếm quota chờ AI.
export async function readFamilyUsage(
  tx: FamilyScopedTx,
  familyId: string,
  dayStart: Date,
): Promise<UsageCounts> {
  const result = await tx.execute<UsageRow>(sql`
    SELECT COALESCE(SUM(size_bytes) FILTER (WHERE image_key IS NOT NULL), 0)::bigint AS storage_bytes,
           (COUNT(*) FILTER (WHERE created_at >= ${dayStart.toISOString()}))::int AS uploads_today,
           (COUNT(*) FILTER (WHERE (status = 'uploaded' AND privacy_approved_by IS NOT NULL AND created_at > now() - ${STUCK_UPLOAD_AFTER}::interval)
              OR status = 'extracting'))::int AS pending_jobs
    FROM source_documents WHERE family_id = ${familyId}`);
  const row = result.rows[0]!;
  return {
    storageBytes: Number(row.storage_bytes),
    uploadsToday: row.uploads_today,
    pendingJobs: row.pending_jobs,
  };
}
