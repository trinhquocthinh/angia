import type { SelfReminder } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';

export const session: ProfileSession = {
  account: { id: 'a', displayName: 'Mẹ', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
export const reminder: SelfReminder = {
  id: '00000000-0000-4000-8000-000000000001',
  date: '2026-11-11',
  slot: 'morning',
  scheduledAt: '2026-11-11T00:00:00.000Z',
  medications: [{ name: 'Thuốc trong lời nhắc', strength: null, quantityPerDose: null, doseUnit: null }],
  confirmation: null,
  canConfirm: true,
  canUndo: false,
};
