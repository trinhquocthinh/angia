import { and, desc, eq } from 'drizzle-orm';
import { adherencePeriods } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AdherencePeriod } from '../domain/AdherencePeriod.js';
import { adherencePeriodColumns } from './adherencePeriodColumns.js';

export async function findLatestAdherencePeriod(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  medicationNameNormalized: string,
): Promise<AdherencePeriod | null> {
  const [row] = await tx
    .select(adherencePeriodColumns)
    .from(adherencePeriods)
    .where(
      and(
        eq(adherencePeriods.familyId, familyId),
        eq(adherencePeriods.healthProfileId, profileId),
        eq(adherencePeriods.medicationNameNormalized, medicationNameNormalized),
      ),
    )
    .orderBy(desc(adherencePeriods.fromDate))
    .limit(1);
  return row ?? null;
}
