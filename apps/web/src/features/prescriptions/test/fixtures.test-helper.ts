import type { Prescription, PrescriptionDetail, PrescriptionListItem } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';

export const profileId = '00000000-0000-4000-8000-000000000001';
export const firstId = '00000000-0000-4000-8000-000000000002';
export const secondId = '00000000-0000-4000-8000-000000000003';
export const session = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
} satisfies ProfileSession;
export const profile = { id: profileId, familyId: 'f', consentStatus: 'confirmed' } as HealthProfile;
export const item = {
  id: firstId,
  name: 'Thuốc A',
  strength: '5 mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  externalUse: false,
  note: 'Ghi trên đơn',
  totalQuantity: 30,
} satisfies Prescription['items'][number];
export const chain: PrescriptionListItem[] = [
  {
    id: firstId,
    issuedDate: '2026-10-01',
    facility: 'Nơi khám A',
    diagnosis: null,
    itemCount: 2,
    revisitDate: '2026-11-01',
    origin: 'document',
  },
  {
    id: secondId,
    issuedDate: '2026-11-01',
    facility: null,
    diagnosis: null,
    itemCount: 1,
    revisitDate: null,
    origin: 'manual',
  },
];
export const detail: PrescriptionDetail = {
  prescription: {
    id: secondId,
    healthProfileId: profileId,
    sourceDocumentId: null,
    issuedDate: '2026-11-01',
    revisitDate: null,
    facility: null,
    diagnosis: 'Nội dung trên đơn',
    manualWithoutSource: true,
    createdAt: '2026-11-01T00:00:00Z',
    items: [item],
  },
  previousId: firstId,
  nextId: null,
  courses: [],
  diff: {
    added: [{ name: 'Thuốc C', items: [{ ...item, name: 'Thuốc C' }] }],
    removed: [{ name: 'Thuốc B', items: [{ ...item, name: 'Thuốc B' }] }],
    changed: [{ name: 'Thuốc A', changes: [{ field: 'strength', before: '5 mg', after: '10 mg' }] }],
  },
};
