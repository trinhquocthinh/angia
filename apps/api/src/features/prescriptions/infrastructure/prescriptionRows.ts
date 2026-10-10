import type { prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { DoseSlot, Prescription } from '../domain/Prescription.js';

type PrescriptionRow = typeof prescriptions.$inferSelect;
type PrescriptionItemRow = typeof prescriptionItems.$inferSelect;

const fromNumeric = (value: string | null) => (value === null ? null : Number(value));

// Cột numeric trả chuỗi; dòng thuốc sắp theo `position` như thứ tự trên đơn.
export function toPrescription(row: PrescriptionRow, itemRows: PrescriptionItemRow[]): Prescription {
  return {
    id: row.id,
    healthProfileId: row.healthProfileId,
    sourceDocumentId: row.sourceDocumentId,
    issuedDate: row.issuedDate,
    facility: row.facility,
    diagnosis: row.diagnosis,
    manualWithoutSource: row.manualWithoutSource,
    createdAt: row.createdAt,
    items: [...itemRows]
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
