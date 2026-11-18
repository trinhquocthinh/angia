import { sql } from 'drizzle-orm';
import { withFamilyScope, type FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';

// Danh sách cố định, không nhận tên bảng từ file/CLI. Quota và operation là lượt OCR hiện hành.
const V1_FAMILY_TABLES = [
  'health_profiles',
  'medication_courses',
  'reminders',
  'dose_confirmations',
  'source_documents',
  'extractions',
  'family_scan_quotas',
  'ocr_operations',
] as const;
const globalTables = ['accounts', 'legal_acceptances', 'scan_quota_months'] as const;
type Summary = { count: number; checksum: string };

export async function readV1FamilySnapshot(tx: FamilyScopedTx, families: string[]) {
  const counts: Record<string, Record<string, number>> = {};
  const checksums: Record<string, string> = {};
  for (const familyId of families) {
    counts[familyId] = {};
    await withFamilyScope(tx, familyId, async (scoped) => {
      for (const table of V1_FAMILY_TABLES) {
        const { rows } = await scoped.execute<Summary>(sql`SELECT count(*)::int AS count,
          md5(COALESCE(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text), '')) AS checksum
          FROM public.${sql.identifier(table)} t WHERE t.family_id = ${familyId}::uuid`);
        counts[familyId]![table] = rows[0]!.count;
        checksums[`${familyId}/${table}`] = rows[0]!.checksum;
      }
    });
  }
  for (const table of globalTables) {
    const { rows } = await tx.execute<Summary>(sql`SELECT count(*)::int AS count,
      md5(COALESCE(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text), '')) AS checksum
      FROM public.${sql.identifier(table)} t`);
    checksums[table] = `${rows[0]!.count}/${rows[0]!.checksum}`;
  }
  return { counts, checksums };
}
