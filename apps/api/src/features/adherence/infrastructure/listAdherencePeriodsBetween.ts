import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { adherencePeriods } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AdherencePeriod } from '../domain/AdherencePeriod.js';
import { adherencePeriodColumns } from './adherencePeriodColumns.js';

// SPEC-023: giai đoạn giao với [from, to] (đang mở coi như kéo tới vô hạn); giữ nguyên mốc, không cắt.
export function listAdherencePeriodsBetween(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  from: string,
  to: string,
): Promise<AdherencePeriod[]> {
  return tx
    .select(adherencePeriodColumns)
    .from(adherencePeriods)
    .where(
      and(
        eq(adherencePeriods.familyId, familyId),
        eq(adherencePeriods.healthProfileId, profileId),
        lte(adherencePeriods.fromDate, to),
        or(isNull(adherencePeriods.toDate), gte(adherencePeriods.toDate, from)),
      ),
    )
    .orderBy(adherencePeriods.medicationNameNormalized, adherencePeriods.fromDate);
}
