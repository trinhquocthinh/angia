import { and, eq } from 'drizzle-orm';
import { painIssueSummarySchema, type PainIssueSummary } from '@angia/contracts';
import { painIssues as issues } from '@src/shared/db/schema/index.js';
import { painSummaryColumns } from './painSummaryColumns.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painIssueWhere } from './painIssueWhere.js';
import { readPainActors } from './readPainActors.js';

export async function readPainSummaries(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  status: 'tracking' | 'resolved' | 'all' = 'all',
  issueId?: string,
): Promise<PainIssueSummary[]> {
  const rows = await tx
    .select(painSummaryColumns)
    .from(issues)
    .where(
      and(
        painIssueWhere(familyId, profileId, issueId),
        status === 'all' ? undefined : eq(issues.status, status),
      ),
    );
  const actor = await readPainActors(
    tx,
    rows.flatMap((r) => [r.createdBy, r.updatedBy]),
  );
  return rows
    .map((r) =>
      painIssueSummarySchema.parse({
        id: r.id,
        region: r.region,
        side: r.side,
        title: r.title,
        status: r.status,
        resolvedOn: r.resolvedOn,
        lastEntry: { level: r.level, recordedAt: r.recordedAt.toISOString() },
        entryCount: r.entryCount,
        exerciseCount: r.exerciseCount,
        createdBy: actor(r.createdBy),
        updatedBy: actor(r.updatedBy),
        updatedAt: r.updatedAt.toISOString(),
      }),
    )
    .sort(
      (a, b) =>
        Number(b.status === 'tracking') - Number(a.status === 'tracking') ||
        Date.parse(b.lastEntry.recordedAt) - Date.parse(a.lastEntry.recordedAt) ||
        a.id.localeCompare(b.id),
    );
}
