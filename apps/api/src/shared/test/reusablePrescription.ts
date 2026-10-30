import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';

type Item = Prescription['items'][number];
const item = (id: string, overrides: Partial<Item>): Item => ({
  id,
  name: 'Amlodipin',
  strength: '5mg',
  quantityPerDose: 1,
  externalUse: false,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: null,
  ...overrides,
});

// Đơn mẫu cho test Dùng lại đơn (SPEC-029): thuốc có hạn, dài hạn và kem dùng ngoài không ghi liều.
export function reusablePrescription(issuedDate = '2026-09-01'): Prescription {
  return {
    id: 'p-1',
    healthProfileId: 'profile-1',
    sourceDocumentId: null,
    issuedDate,
    revisitDate: null,
    facility: null,
    diagnosis: null,
    manualWithoutSource: true,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    items: [
      item('item-1', {}),
      item('item-2', {
        name: 'Metformin',
        strength: '500mg',
        slots: ['morning', 'evening'],
        durationDays: null,
        longTerm: true,
      }),
      item('item-3', {
        name: 'Betamethason',
        strength: '15g',
        quantityPerDose: null,
        externalUse: true,
        doseUnit: 'tuýp',
        slots: ['as_needed'],
        durationDays: 7,
      }),
    ],
  };
}
