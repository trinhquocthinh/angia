import type { PainIssueSummary } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';

export const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
export const profile = {
  id: 'p',
  familyId: 'f',
  displayName: 'An',
  consentStatus: 'confirmed',
  birthYear: 2020,
  vitalsEnabled: null,
} as HealthProfile;
export const issue: PainIssueSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  region: 'knee',
  side: 'left',
  title: 'Sau khi đi bộ',
  status: 'tracking',
  resolvedOn: null,
  lastEntry: { level: 6, recordedAt: '2026-11-06T18:30:00Z' },
  entryCount: 3,
  exerciseCount: 0,
  createdBy: null,
  updatedBy: null,
  updatedAt: '2026-11-06T18:30:00Z',
};
