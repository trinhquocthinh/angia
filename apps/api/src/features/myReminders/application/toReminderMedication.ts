import type { StoredReminderMedication } from './ports.js';

// Thuốc của buổi trả ra ngoài: bỏ courseId, trường thiếu trong ảnh chụp thành null.
export function toReminderMedication(medication: StoredReminderMedication) {
  return {
    name: medication.name,
    strength: medication.strength ?? null,
    quantityPerDose: medication.quantityPerDose ?? null,
    doseUnit: medication.doseUnit ?? null,
  };
}
