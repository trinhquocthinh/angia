import { and, eq } from 'drizzle-orm';
import { adherencePeriods } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AdherencePeriod } from '../domain/AdherencePeriod.js';
import { adherencePeriodColumns } from './adherencePeriodColumns.js';

export function listStoredAdherencePeriods(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<AdherencePeriod[]> {
  return tx
    .select(adherencePeriodColumns)
    .from(adherencePeriods)
    .where(and(eq(adherencePeriods.familyId, familyId), eq(adherencePeriods.healthProfileId, profileId)))
    .orderBy(adherencePeriods.medicationNameNormalized, adherencePeriods.fromDate);
}
