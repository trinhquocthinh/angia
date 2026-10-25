import { and, asc, eq } from 'drizzle-orm';
import { labResults } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { LabResult } from '../domain/LabResult.js';

// SPEC-021: dùng chỉ mục (health_profile_id, test_name_normalized, result_date); cũ nhất trước.
export async function listLabResults(
  tx: FamilyScopedTx,
  familyId: string,
  healthProfileId: string,
  normalizedTestName: string | undefined,
): Promise<LabResult[]> {
  const rows = await tx
    .select()
    .from(labResults)
    .where(
      and(
        eq(labResults.familyId, familyId),
        eq(labResults.healthProfileId, healthProfileId),
        normalizedTestName === undefined ? undefined : eq(labResults.testNameNormalized, normalizedTestName),
      ),
    )
    .orderBy(asc(labResults.resultDate), asc(labResults.createdAt), asc(labResults.id));
  return rows.map(({ familyId: _family, testNameNormalized: _normalized, ...result }) => result);
}
