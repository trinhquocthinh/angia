import { asc } from 'drizzle-orm';
import type { PainEntry } from '@angia/contracts';
import { painEntries } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painChildWhere } from './painChildWhere.js';
import { readPainActors } from './readPainActors.js';

export async function readPainEntries(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
  entryId?: string,
): Promise<PainEntry[]> {
  const rows = await tx
    .select()
    .from(painEntries)
    .where(painChildWhere(painEntries, familyId, profileId, issueId, entryId))
    .orderBy(asc(painEntries.recordedAt), asc(painEntries.id));
  const actor = await readPainActors(
    tx,
    rows.flatMap((r) => [r.createdByAccountId, r.updatedByAccountId]),
  );
  return rows.map((r) => ({
    id: r.id,
    level: r.level,
    recordedAt: r.recordedAt.toISOString(),
    note: r.note,
    createdBy: actor(r.createdByAccountId),
    updatedBy: actor(r.updatedByAccountId),
    updatedAt: r.updatedAt.toISOString(),
  }));
}
