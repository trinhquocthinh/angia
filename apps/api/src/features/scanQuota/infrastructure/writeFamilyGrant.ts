import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { QuotaRow, QuotaTx } from './quotaTypes.js';
interface GrantWrite {
  familyId: string;
  month: string;
  total: number;
  status: 'trial' | 'approved';
  reason: string;
  version: number;
  actorId: string;
  now: Date;
  before: QuotaRow | null;
}
export async function writeFamilyGrant(tx: QuotaTx, input: GrantWrite): Promise<void> {
  await withFamilyScope(tx, input.familyId, async (scoped) => {
    const after = {
      status: input.status,
      grantedScans: input.total,
      usedScans: Number(input.before?.used_scans ?? 0),
      heldScans: Number(input.before?.held_scans ?? 0),
    };
    const before = input.before
      ? {
          status: input.before.status,
          grantedScans: Number(input.before.granted_scans),
          usedScans: Number(input.before.used_scans),
          heldScans: Number(input.before.held_scans),
        }
      : null;
    await scoped.execute(sql`INSERT INTO family_scan_quotas (family_id, month, status, granted_scans, updated_at, updated_by) VALUES (${input.familyId}, ${input.month}, ${input.status}, ${input.total}, ${input.now}, ${input.actorId})
      ON CONFLICT (family_id, month) DO UPDATE SET status=EXCLUDED.status, granted_scans=EXCLUDED.granted_scans, updated_at=EXCLUDED.updated_at, updated_by=EXCLUDED.updated_by`);
    await scoped.execute(
      sql`INSERT INTO scan_quota_audit (id, family_id, month, version, actor_id, occurred_at, before, after, reason) VALUES (${randomUUID()}, ${input.familyId}, ${input.month}, ${input.version}, ${input.actorId}, ${input.now}, ${before === null ? null : JSON.stringify(before)}::jsonb, ${JSON.stringify(after)}::jsonb, ${input.reason})`,
    );
  });
}
