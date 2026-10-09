import { prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { normalizeName } from '../domain/normalizeName.js';
import type { DoseSlot, NewPrescription, Prescription } from '../domain/Prescription.js';

const toNumeric = (value: number | null) => (value === null ? null : String(value));
const fromNumeric = (value: string | null) => (value === null ? null : Number(value));

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
  return {
    id: row.id,
    healthProfileId: row.healthProfileId,
    sourceDocumentId: row.sourceDocumentId,
    issuedDate: row.issuedDate,
    facility: row.facility,
    diagnosis: row.diagnosis,
    manualWithoutSource: row.manualWithoutSource,
    createdAt: row.createdAt,
    items: itemRows
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        name: item.name,
        strength: item.strength,
        quantityPerDose: Number(item.quantityPerDose),
        doseUnit: item.doseUnit,
        slots: item.slots as DoseSlot[],
        durationDays: item.durationDays,
        longTerm: item.longTerm,
        note: item.note,
        totalQuantity: fromNumeric(item.totalQuantity),
      })),
  };
}
