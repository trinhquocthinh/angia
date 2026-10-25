import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import { labResults } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { LabResult, NewLabResult } from '../domain/LabResult.js';

// Mỗi chỉ số một dòng, giữ nguyên văn (BR-022); tên chuẩn hóa để vẽ chuỗi biến thiên (SPEC-021).
export async function insertLabResults(
  tx: FamilyScopedTx,
  familyId: string,
  inputs: NewLabResult[],
): Promise<LabResult[]> {
  const rows = await tx
    .insert(labResults)
    .values(
      inputs.map((input) => ({ ...input, familyId, testNameNormalized: normalizeName(input.testName) })),
    )
    .returning();
  return rows.map(({ familyId: _family, testNameNormalized: _normalized, ...result }) => result);
}
