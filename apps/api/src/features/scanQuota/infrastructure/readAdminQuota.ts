import { budgetMonth, type AdminScanQuotaView } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ScanQuotaContext, ScanQuotaDefaults } from '../application/ports.js';
import { effectiveCapacity } from './effectiveCapacity.js';
import { loadQuotaState } from './loadQuotaState.js';
import { readQuotaBilling } from './readQuotaBilling.js';
import { toFamilyQuota } from './readFamilyQuota.js';
import type { QuotaRow, QuotaTx } from './quotaTypes.js';
export async function readAdminQuota(
  tx: QuotaTx,
  context: ScanQuotaContext,
  defaults: ScanQuotaDefaults,
): Promise<AdminScanQuotaView> {
  const month = budgetMonth(context.now);
  const allocation = await loadQuotaState(tx, month, defaults);
  const billing = await readQuotaBilling(tx, month, context);
  const effective = effectiveCapacity(allocation, billing);
  const { policy } = effective;
  const capacity = effective.capacity ?? { availableAdditionalScans: null, overAllocatedScans: null };
  const rows = await tx.execute<{ id: string; name: string }>(
    sql`SELECT id, name FROM families ORDER BY created_at, id`,
  );
  const familyViews: AdminScanQuotaView['families'] = [];
  for (const family of rows.rows) {
    const view = await withFamilyScope(tx, family.id, async (scoped) => {
      const quotas = await scoped.execute<QuotaRow & { month: string }>(
        sql`SELECT month, status, granted_scans::text, used_scans::text, held_scans::text FROM family_scan_quotas WHERE family_id=${family.id} AND month IN (${month}, to_char((${month + '-01'}::date - interval '1 month'), 'YYYY-MM'))`,
      );
      const previous = quotas.rows.find((q) => q.month !== month && q.status === 'approved');
      return {
        familyId: family.id,
        familyName: family.name,
        quota: toFamilyQuota(
          month,
          quotas.rows.find((q) => q.month === month),
          defaults.monthlyScans,
        ),
        previousApprovedScans: previous ? Number(previous.granted_scans) : null,
      };
    });
    familyViews.push(view);
  }
  return {
    month,
    version: allocation.version,
    policy,
    monthlyCapUsd: billing.monthlyCapUsd,
    actualSpendUsd: billing.actualSpendUsd,
    billingStatus: billing.billingStatus,
    committedRemainingScans: allocation.committed,
    ...capacity,
    families: familyViews,
    runtimeActive: true,
  };
}
