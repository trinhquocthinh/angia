import type { MyReminder } from '@angia/contracts';

// "tên · hàm lượng · số lượng đơn vị", bỏ phần không ghi; chỉ mô tả dữ liệu đã lưu (BR-033).
export function reminderMedicationLine(medication: MyReminder['medications'][number]): string {
  const dose = [medication.quantityPerDose, medication.doseUnit].filter(Boolean).join(' ');
  return [medication.name, medication.strength, dose].filter(Boolean).join(' · ');
}
