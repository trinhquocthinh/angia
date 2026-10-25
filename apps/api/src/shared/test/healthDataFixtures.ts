// Bản ghi mẫu dùng chung cho test route dữ liệu sức khỏe (NFR-4).
export const manualReading = {
  type: 'device_reading',
  measuredAt: '2026-10-05',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: 130,
  diastolic: 90,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
} as const;
// Đơn nhập tay của nạn nhân để thử Dùng lại đơn (SPEC-029).
export const manualPrescription = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: null,
  diagnosis: null,
  items: [
    {
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
  ],
} as const;

export const manualCourse = {
  name: 'Canxi',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
};
