import { asc } from 'drizzle-orm';
import { painEntries } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painChildWhere } from './painChildWhere.js';

export async function firstPainRecordedAt(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
) {
  return (
    (
      await tx
        .select({ at: painEntries.recordedAt })
        .from(painEntries)
        .where(painChildWhere(painEntries, familyId, profileId, issueId))
        .orderBy(asc(painEntries.recordedAt))
        .limit(1)
    )[0]?.at.toISOString() ?? null
  );
}
