import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { ReminderRecipientRepository } from '@src/features/reminders/application/recipientPorts.js';
import type { FamilyAccount } from '@src/features/reminders/domain/ReminderRecipient.js';

type MemoryProfile = { id: string; familyId: string; consentStatus: ConsentStatus };
type StoredRecipient = { familyId: string; profileId: string; accountId: string };

const DEFAULT_ACCOUNTS: (FamilyAccount & { familyId: string })[] = [
  { id: 'dad', displayName: 'Bố', role: 'main', healthProfileId: null, familyId: 'family-a' },
  { id: 'mom', displayName: 'Mẹ', role: 'main', healthProfileId: null, familyId: 'family-a' },
  {
    id: 'grandma',
    displayName: 'Bà',
    role: 'member',
    healthProfileId: 'grandma-profile',
    familyId: 'family-a',
  },
];

// Mô phỏng giao dịch: ghi trên bản sao, chỉ thay dữ liệu đã commit khi work thành công.
export function createMemoryReminderRecipientRepository(
  profiles: MemoryProfile[] = [
    { id: 'an', familyId: 'family-a', consentStatus: 'confirmed' },
    { id: 'grandma-profile', familyId: 'family-a', consentStatus: 'confirmed' },
  ],
  accounts = DEFAULT_ACCOUNTS,
) {
  const state = { recipients: [] as StoredRecipient[] };
  const repository: ReminderRecipientRepository = {
    withFamily: async (familyId, work) => {
      let draft = state.recipients.map((r) => ({ ...r }));
      const result = await work({
        findProfile: async (id) => profiles.find((p) => p.id === id && p.familyId === familyId) ?? null,
        listFamilyAccounts: async () =>
          accounts.filter((a) => a.familyId === familyId).map(({ familyId: _, ...a }) => a),
        listRecipientIds: async (profileId) =>
          draft.filter((r) => r.familyId === familyId && r.profileId === profileId).map((r) => r.accountId),
        replaceRecipients: async (profileId, accountIds) => {
          draft = draft
            .filter((r) => !(r.familyId === familyId && r.profileId === profileId))
            .concat(accountIds.map((accountId) => ({ familyId, profileId, accountId })));
        },
      });
      state.recipients = draft;
      return result;
    },
  };
  return { repository, state };
}
