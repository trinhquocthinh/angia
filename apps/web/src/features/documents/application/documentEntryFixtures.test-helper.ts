import type { DocumentEntry } from '@angia/contracts';

export const PROFILE_ID = '00000000-0000-4000-8000-000000000001';
const empty = { prescription: null, labResults: [], measurements: [] };

// Mục danh mục mẫu cho test web (SPEC-028).
export function entry(overrides: Partial<DocumentEntry> = {}): DocumentEntry {
  return {
    id: '00000000-0000-4000-8000-0000000000aa',
    origin: 'document',
    type: 'lab_result',
    status: 'approved',
    entryDate: '2026-10-01',
    dateKnown: true,
    createdAt: '2026-10-13T08:00:00.000Z',
    hasImage: true,
    records: empty,
    ...overrides,
  };
}

export const savedPrescription = {
  id: '00000000-0000-4000-8000-0000000000bb',
  healthProfileId: PROFILE_ID,
  sourceDocumentId: null,
  issuedDate: '2026-10-01',
  facility: 'BV Gia Định',
  diagnosis: null,
  manualWithoutSource: true,
  createdAt: '2026-10-01T03:00:00.000Z',
  items: [
    {
      id: '00000000-0000-4000-8000-0000000000c1',
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      externalUse: false,
      doseUnit: 'viên',
      slots: ['morning' as const],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
    {
      id: '00000000-0000-4000-8000-0000000000c2',
      name: 'Metformin',
      strength: '500mg',
      quantityPerDose: 1,
      externalUse: false,
      doseUnit: 'viên',
      slots: ['morning' as const, 'evening' as const],
      durationDays: null,
      longTerm: true,
      note: null,
      totalQuantity: null,
    },
    {
      id: '00000000-0000-4000-8000-0000000000c3',
      name: 'Betamethason',
      strength: '15g',
      quantityPerDose: null,
      externalUse: true,
      doseUnit: 'tuýp',
      slots: ['as_needed' as const],
      durationDays: 7,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
  ],
};
