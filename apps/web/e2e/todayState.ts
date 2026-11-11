import type { SelfReminder } from '@angia/contracts';
import type { components } from '../src/shared/api/schema.gen.js';
type ProfileListItem = components['schemas']['ProfileListItem'];
const reminder: SelfReminder = {
  id: '00000000-0000-4000-8000-000000000001',
  date: '2026-11-11',
  slot: 'morning',
  scheduledAt: '2026-11-11T00:00:00Z',
  medications: [{ name: 'Thuốc trong lời nhắc', strength: null, quantityPerDose: null, doseUnit: null }],
  confirmation: null,
  canConfirm: true,
  canUndo: false,
};

const profileId = '00000000-0000-4000-8000-000000000002';
const otherId = '00000000-0000-4000-8000-000000000003';
const familyId = '00000000-0000-4000-8000-000000000004';
const accountId = '00000000-0000-4000-8000-000000000005';

export function todayState(role: 'main' | 'member') {
  const own: ProfileListItem = {
    id: profileId,
    familyId,
    displayName: 'Mẹ',
    birthYear: 1950,
    vitalsEnabled: null,
    consentStatus: 'confirmed',
    consentConfirmedAt: '2026-11-01T00:00:00Z',
    consentConfirmedBy: accountId,
    consentBasis: 'self',
    consentSource: 'self',
    consentRespondentName: null,
    createdAt: '2026-11-01T00:00:00Z',
    consentAction: null,
    hasLinkedAccount: true,
    consentConfirmedByName: 'Mẹ',
  };
  const state = {
    session: {
      csrfToken: 'csrf',
      features: { redactionSuggestions: false },
      role,
      family: { id: familyId, name: 'Nhà thử' },
      account: {
        id: accountId,
        displayName: 'Mẹ',
        isSystemAdmin: false,
        healthProfileId: profileId as string | null,
      },
    },
    profiles: [own, { ...own, id: otherId, displayName: 'Ba', hasLinkedAccount: false }],
    consentStatus: 'confirmed' as ProfileListItem['consentStatus'],
    rows: [
      reminder,
      {
        ...reminder,
        id: '00000000-0000-4000-8000-000000000006',
        slot: 'evening' as const,
        scheduledAt: '2026-11-11T11:00:00Z',
      },
    ] as SelfReminder[],
    readError: false,
    writeError: false,
    reads: [] as string[],
    writes: [] as { method: string; csrf: string | undefined }[],
  };
  return state;
}
export type TodayState = ReturnType<typeof todayState>;
