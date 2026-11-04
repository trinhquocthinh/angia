import { asNeededDoses } from '@src/shared/db/schema/index.js';
import { toNumeric } from '@src/shared/db/numericColumn.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AsNeededDose, NewAsNeededDose } from '../domain/AsNeededDose.js';
import { asNeededDoseColumns, toAsNeededDose } from './asNeededDoseColumns.js';

export async function insertAsNeededDose(
  tx: FamilyScopedTx,
  familyId: string,
  input: NewAsNeededDose,
): Promise<AsNeededDose> {
  const [row] = await tx
    .insert(asNeededDoses)
    .values({
      familyId,
      healthProfileId: input.healthProfileId,
      medicationCourseId: input.courseId,
      givenAt: input.givenAt,
      quantity: toNumeric(input.quantity),
      unit: input.unit,
      recordedByAccountId: input.recordedBy,
    })
    .returning(asNeededDoseColumns);
  if (!row) throw new Error('Không ghi được liều "Khi cần"');
  return toAsNeededDose(row);
}
