import { budgetMonth, type FamilyScanQuota } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { QuotaRow, QuotaTx } from './quotaTypes.js';
// CP5.5: chưa có dòng tháng = lượt mặc định hệ thống (GET không ghi DB).
export function toFamilyQuota(
  month: string,
  row: QuotaRow | undefined,
  defaultScans: number,
): FamilyScanQuota {
  const grantedScans = Number(row?.granted_scans ?? defaultScans);
  const usedScans = Number(row?.used_scans ?? 0);
  const heldScans = Number(row?.held_scans ?? 0);
  return {
    month,
    status: row?.status ?? (defaultScans > 0 ? 'default' : 'unconfigured'),
    grantedScans,
    usedScans,
    heldScans,
    remainingScans: grantedScans - usedScans - heldScans,
    runtimeActive: true,
  };
}
export async function readFamilyQuota(
  db: Pick<Database, 'transaction'>,
  familyId: string,
  now: Date,
  defaultScans: number,
): Promise<FamilyScanQuota> {
  const month = budgetMonth(now);
  return withFamilyScope(db, familyId, async (tx: QuotaTx) => {
    const rows = await tx.execute<QuotaRow>(
      sql`SELECT status, granted_scans::text, used_scans::text, held_scans::text FROM family_scan_quotas WHERE family_id=${familyId} AND month=${month}`,
    );
    return toFamilyQuota(month, rows.rows[0], defaultScans);
  });
}
