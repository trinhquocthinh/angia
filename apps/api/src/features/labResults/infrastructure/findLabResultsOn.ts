import { and, asc, eq } from 'drizzle-orm';
import { labResults } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { LabResult } from '../domain/LabResult.js';

// Chỉ số đã lưu của hồ sơ trong một ngày trả kết quả, kể cả bản nhập trực tiếp (SPEC-012).
export async function findLabResultsOn(
  tx: FamilyScopedTx,
  familyId: string,
  healthProfileId: string,
  resultDate: string,
): Promise<LabResult[]> {
  const rows = await tx
    .select()
    .from(labResults)
    .where(
      and(
        eq(labResults.familyId, familyId),
        eq(labResults.healthProfileId, healthProfileId),
        eq(labResults.resultDate, resultDate),
      ),
    )
    .orderBy(asc(labResults.createdAt), asc(labResults.id));
  return rows.map(({ familyId: _family, testNameNormalized: _normalized, ...result }) => result);
}
