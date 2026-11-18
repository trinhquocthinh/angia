import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type pg from 'pg';
import * as schema from '../../apps/api/src/shared/db/schema/index.js';
import { withFamilyScope, type FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { parseV1FamilyMapping, type V1FamilyMapping } from './parseV1FamilyMapping.js';
import { readV1FamilyPlan } from './readV1FamilyPlan.js';
import { readV1FamilySnapshot } from './readV1FamilySnapshot.js';
import { V1FamilyOwnersError } from './V1FamilyOwnersError.js';

async function checkOwner(tx: FamilyScopedTx, env?: string) {
  const { rows } = await tx.execute<{ owner: boolean; environment: boolean }>(sql`SELECT
    pg_get_userbyid(c.relowner) = current_user AS owner,
    (${env ?? null}::text IS NULL OR (current_database() = 'angia_' || ${env ?? null}::text
      AND current_user = 'angia_' || ${env ?? null}::text)) AS environment
    FROM pg_class c WHERE c.oid = 'public.families'::regclass`);
  if (!rows[0]?.owner || !rows[0].environment)
    throw new V1FamilyOwnersError(
      'Cần role owner của bảng families và DB đúng --env; không dùng role runtime.',
    );
}

async function convert(tx: FamilyScopedTx, mapping: V1FamilyMapping, dryRun: boolean) {
  const plan = await readV1FamilyPlan(tx, mapping);
  const families = plan.map((p) => p.familyId);
  const before = await readV1FamilySnapshot(tx, families);
  let ownersUpdated = 0;
  let guardiansInserted = 0;
  for (const p of plan) {
    await withFamilyScope(tx, p.familyId, async (scoped) => {
      if (p.update) {
        await scoped.execute(sql`UPDATE public.families SET owner_account_id = ${p.ownerAccountId}::uuid
        WHERE id = ${p.familyId}::uuid AND owner_account_id IS NULL`);
        ownersUpdated++;
      }
      for (const g of p.guardians.filter((g) => g.insert)) {
        await scoped.execute(sql`INSERT INTO public.profile_guardians(health_profile_id,family_id,account_id)
        VALUES(${g.profileId}::uuid,${p.familyId}::uuid,${g.accountId}::uuid)`);
        guardiansInserted++;
      }
    });
  }
  // Dry-run cũng buộc mọi constraint deferred chạy trước khi đối chiếu và rollback.
  await tx.execute(sql`SET CONSTRAINTS ALL IMMEDIATE`);
  const remaining = await readV1FamilyPlan(tx, mapping);
  if (remaining.some((p) => p.update || p.guardians.some((g) => g.insert)))
    throw new V1FamilyOwnersError('Chuyển đổi chưa hoàn tất; rollback toàn bộ.');
  const after = await readV1FamilySnapshot(tx, families);
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new V1FamilyOwnersError('Đối chiếu số đếm/nội dung trước và sau không khớp; rollback toàn bộ.');
  return {
    mode: dryRun ? 'dry-run' : 'apply',
    ownersUpdated,
    guardiansInserted,
    before: before.counts,
    after: after.counts,
  };
}

class DryRunRollback extends Error {
  constructor(readonly report: Awaited<ReturnType<typeof convert>>) {
    super('dry-run');
  }
}

export async function runV1FamilyOwners(
  client: pg.Client,
  input: V1FamilyMapping,
  { dryRun = false, env }: { dryRun?: boolean; env?: string } = {},
) {
  const mapping = parseV1FamilyMapping(input.owners, input.creators);
  try {
    return await drizzle(client, { schema }).transaction(async (tx) => {
      await checkOwner(tx, env);
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '60s'`);
      // Chặn ghi đồng thời cả nhà mới và bảng đối chiếu trong transaction vận hành ngắn.
      await tx.execute(sql`LOCK TABLE public.families, public.accounts, public.profile_guardians,
        public.health_profiles, public.medication_courses, public.reminders, public.dose_confirmations,
        public.source_documents, public.extractions, public.family_scan_quotas, public.ocr_operations,
        public.legal_acceptances, public.scan_quota_months IN SHARE ROW EXCLUSIVE MODE`);
      const report = await convert(tx, mapping, dryRun);
      if (dryRun) throw new DryRunRollback(report);
      return report;
    });
  } catch (error) {
    if (error instanceof DryRunRollback) return error.report;
    throw error;
  }
}
