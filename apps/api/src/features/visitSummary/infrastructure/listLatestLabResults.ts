import { and, asc, desc, eq, lte } from 'drizzle-orm';
import { labResults } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';

// SPEC-024: một bản mới nhất mỗi tên, kể cả trước from; domain giữ thứ tự nhóm theo SPEC-021.
export async function listLatestLabResults(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  to: string,
): Promise<LabResult[]> {
  const rows = await tx
    .selectDistinctOn([labResults.testNameNormalized])
    .from(labResults)
    .where(
      and(
        eq(labResults.familyId, familyId),
        eq(labResults.healthProfileId, profileId),
        lte(labResults.resultDate, to),
      ),
    )
    .orderBy(
      asc(labResults.testNameNormalized),
      desc(labResults.resultDate),
      desc(labResults.createdAt),
      desc(labResults.id),
    );
  return rows.map(({ familyId: _family, testNameNormalized: _normalized, ...result }) => result);
}
