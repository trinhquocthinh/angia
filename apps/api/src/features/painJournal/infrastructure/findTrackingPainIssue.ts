import { and, eq, ne } from 'drizzle-orm';
import type { PainIssue } from '../domain/painIssue.js';
import { painIssues } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painIssueWhere } from './painIssueWhere.js';

export async function findTrackingPainIssue(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  location: Pick<PainIssue, 'region' | 'side'>,
  excludeIssueId?: string,
) {
  return (
    (
      await tx
        .select({ id: painIssues.id })
        .from(painIssues)
        .where(
          and(
            painIssueWhere(familyId, profileId),
            eq(painIssues.status, 'tracking'),
            eq(painIssues.region, location.region),
            eq(painIssues.side, location.side),
            excludeIssueId === undefined ? undefined : ne(painIssues.id, excludeIssueId),
          ),
        )
        .limit(1)
    )[0]?.id ?? null
  );
}
