import { prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { normalizeName } from '../domain/normalizeName.js';
import type { NewPrescription, Prescription } from '../domain/Prescription.js';
import { toPrescription } from './prescriptionRows.js';

const toNumeric = (value: number | null) => (value === null ? null : String(value));

// Đơn + dòng thuốc trong cùng transaction của lệnh duyệt; `position` giữ thứ tự dòng trên đơn.
export async function insertPrescription(
  tx: FamilyScopedTx,
  familyId: string,
  input: NewPrescription,
): Promise<Prescription> {
  const { items, ...header } = input;
  const [row] = await tx
    .insert(prescriptions)
    .values({ ...header, familyId })
    .returning();
  if (!row) throw new Error('Không tạo được đơn thuốc');
  const itemRows = await tx
    .insert(prescriptionItems)
    .values(
      items.map((item, position) => ({
        ...item,
        familyId,
        prescriptionId: row.id,
        position,
        nameNormalized: normalizeName(item.name),
        quantityPerDose: String(item.quantityPerDose),
        totalQuantity: toNumeric(item.totalQuantity),
      })),
    )
    .returning();
  return toPrescription(row, itemRows);
}
