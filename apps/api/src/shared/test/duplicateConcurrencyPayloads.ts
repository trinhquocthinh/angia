export const duplicateConcurrencyPayloads = [
  {
    type: 'lab_result',
    resultDate: '2026-10-01',
    facility: null,
    items: [{ testName: 'HbA1c', value: '7.2', unit: null, referenceRange: null }],
  },
  {
    type: 'device_reading',
    measuredAt: '2026-10-01',
    measuredTime: null,
    kind: 'blood_pressure',
    systolic: 130,
    diastolic: 85,
    pulse: null,
    glucoseValue: null,
    glucoseUnit: null,
  },
  {
    type: 'prescription',
    issuedDate: '2026-10-01',
    facility: null,
    diagnosis: null,
    items: [
      {
        name: 'Canxi',
        strength: null,
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning'],
        durationDays: 1,
        longTerm: false,
        note: null,
        totalQuantity: null,
      },
    ],
  },
];
