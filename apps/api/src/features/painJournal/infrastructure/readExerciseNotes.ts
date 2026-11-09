import { asc } from 'drizzle-orm';
import type { ExerciseNote } from '@angia/contracts';
import { exerciseNotes } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { painChildWhere } from './painChildWhere.js';
import { readPainActors } from './readPainActors.js';

export async function readExerciseNotes(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
  exerciseId?: string,
): Promise<ExerciseNote[]> {
  const rows = await tx
    .select()
    .from(exerciseNotes)
    .where(painChildWhere(exerciseNotes, familyId, profileId, issueId, exerciseId))
    .orderBy(asc(exerciseNotes.startDate), asc(exerciseNotes.id));
  const actor = await readPainActors(
    tx,
    rows.flatMap((r) => [r.createdByAccountId, r.updatedByAccountId]),
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    source: r.source,
    prescriber: r.prescriber,
    startDate: r.startDate,
    endDate: r.endDate,
    note: r.note,
    createdBy: actor(r.createdByAccountId),
    updatedBy: actor(r.updatedByAccountId),
    updatedAt: r.updatedAt.toISOString(),
  }));
}
