import { budgetMonth, type FamilyScanQuota } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { QuotaRow, QuotaTx } from './quotaTypes.js';
export function toFamilyQuota(month: string, row: QuotaRow | undefined): FamilyScanQuota {
  const grantedScans = Number(row?.granted_scans ?? 0);
  const usedScans = Number(row?.used_scans ?? 0);
  const heldScans = Number(row?.held_scans ?? 0);
  return {
    month,
    status: row?.status ?? 'unconfigured',
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
): Promise<FamilyScanQuota> {
  const month = budgetMonth(now);
  return withFamilyScope(db, familyId, async (tx: QuotaTx) => {
    const rows = await tx.execute<QuotaRow>(
      sql`SELECT status, granted_scans::text, used_scans::text, held_scans::text FROM family_scan_quotas WHERE family_id=${familyId} AND month=${month}`,
    );
    return toFamilyQuota(month, rows.rows[0]);
  });
}
