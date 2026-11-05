import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { asNeededDoses } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DoseRange } from '../application/ports.js';
import type { AsNeededDose } from '../domain/AsNeededDose.js';
import { asNeededDoseColumns, toAsNeededDose } from './asNeededDoseColumns.js';

export async function listStoredAsNeededDoses(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  range: DoseRange,
): Promise<AsNeededDose[]> {
  const rows = await tx
    .select(asNeededDoseColumns)
    .from(asNeededDoses)
    .where(
      and(
        eq(asNeededDoses.familyId, familyId),
        eq(asNeededDoses.healthProfileId, profileId),
        range.courseId ? eq(asNeededDoses.medicationCourseId, range.courseId) : undefined,
        gte(asNeededDoses.givenAt, range.from),
        lt(asNeededDoses.givenAt, range.to),
      ),
    )
    .orderBy(asc(asNeededDoses.givenAt), asc(asNeededDoses.id));
  return rows.map(toAsNeededDose);
}
