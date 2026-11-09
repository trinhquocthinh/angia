import { count } from 'drizzle-orm';
import { painEntries, exerciseNotes } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painChildWhere } from './painChildWhere.js';

export async function countPainImpact(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
) {
  const [entries] = await tx
    .select({ n: count() })
    .from(painEntries)
    .where(painChildWhere(painEntries, familyId, profileId, issueId));
  const [exercises] = await tx
    .select({ n: count() })
    .from(exerciseNotes)
    .where(painChildWhere(exerciseNotes, familyId, profileId, issueId));
  return { entryCount: entries!.n, exerciseCount: exercises!.n };
}
