import { sql } from 'drizzle-orm';
import { budgetMonth, type GrantScanQuotasRequest } from '@angia/contracts';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ScanQuotaContext, ScanQuotaDefaults } from '../application/ports.js';
import { decideScanGrant } from '../domain/decideScanGrant.js';
import { effectiveCapacity } from './effectiveCapacity.js';
import { lockQuotaBudget } from './lockQuotaBudget.js';
import { readQuotaBilling } from './readQuotaBilling.js';
import { writeFamilyGrant } from './writeFamilyGrant.js';
import { QuotaRejection } from './quotaRejection.js';
import type { QuotaRow, QuotaState, QuotaTx } from './quotaTypes.js';
export async function applyScanGrants(
  tx: QuotaTx,
  request: GrantScanQuotasRequest,
  actorId: string,
  context: ScanQuotaContext,
  state: QuotaState,
  defaults: ScanQuotaDefaults,
): Promise<ScanQuotaContext> {
  await lockQuotaBudget(tx, request.month, context);
  const grants = [...request.grants].sort((a, b) => a.familyId.localeCompare(b.familyId));
  const prepared: { grant: (typeof grants)[number]; before: QuotaRow | null }[] = [];
  // delta: thay đổi so với cam kết hiệu dụng (gồm lượt mặc định); stored: thay đổi snapshot tháng đã ghi.
  let delta = 0n;
  let stored = 0n;
  let newRows = 0;
  for (const grant of grants) {
    const family = await tx.execute(sql`SELECT id FROM families WHERE id=${grant.familyId} FOR KEY SHARE`);
    if (!family.rows[0]) throw new QuotaRejection('ERR_NOT_FOUND');
    const before = await withFamilyScope(tx, grant.familyId, async (scoped) => {
      const result = await scoped.execute<QuotaRow>(
        sql`SELECT status, granted_scans::text, used_scans::text, held_scans::text FROM family_scan_quotas WHERE family_id=${grant.familyId} AND month=${request.month} FOR UPDATE`,
      );
      return result.rows[0] ?? null;
    });
    const decision = decideScanGrant(
      before
        ? { status: before.status, grantedScans: Number(before.granted_scans) }
        : { status: 'default', grantedScans: defaults.monthlyScans },
      grant.grantedScans,
    );
    if (!decision.ok) throw new QuotaRejection(decision.code);
    delta += BigInt(decision.delta);
    stored += BigInt(grant.grantedScans - Number(before?.granted_scans ?? 0));
    if (!before) newRows += 1;
    prepared.push({ grant, before });
  }
  const finalContext = { ...context, now: context.recheckNow?.() ?? context.now };
  if (request.month !== budgetMonth(finalContext.now)) throw new QuotaRejection('ERR_SCAN_QUOTA_CONFLICT');
  const billing = await readQuotaBilling(tx, request.month, finalContext);
  const { capacity } = effectiveCapacity(state, billing);
  if (!capacity || delta > BigInt(capacity.availableAdditionalScans))
    throw new QuotaRejection('ERR_SCAN_QUOTA_UNAVAILABLE');
  for (const { grant, before } of prepared)
    await writeFamilyGrant(tx, {
      familyId: grant.familyId,
      month: request.month,
      total: grant.grantedScans,
      status: 'approved',
      reason: grant.reason,
      version: state.version + 1,
      actorId,
      now: finalContext.now,
      before,
    });
  await tx.execute(
    sql`UPDATE scan_quota_months SET committed_remaining_scans=committed_remaining_scans+${stored.toString()}::numeric, quota_families=quota_families+${newRows} WHERE month=${request.month}`,
  );
  return finalContext;
}
