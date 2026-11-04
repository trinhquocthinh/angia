import { asNeededDoses } from '@src/shared/db/schema/index.js';
import { fromNumeric } from '@src/shared/db/numericColumn.js';
import type { AsNeededDose } from '../domain/AsNeededDose.js';

export const asNeededDoseColumns = {
  id: asNeededDoses.id,
  courseId: asNeededDoses.medicationCourseId,
  givenAt: asNeededDoses.givenAt,
  quantity: asNeededDoses.quantity,
  unit: asNeededDoses.unit,
  recordedBy: asNeededDoses.recordedByAccountId,
  recordedAt: asNeededDoses.createdAt,
};

// Cột numeric trả chuỗi.
export const toAsNeededDose = (row: Omit<AsNeededDose, 'quantity'> & { quantity: string | null }) => ({
  ...row,
  quantity: fromNumeric(row.quantity),
});
