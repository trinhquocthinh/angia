import type { ProfileRepository, ProfileStore } from '@src/features/profiles/application/ports.js';
import type { HealthProfile } from '@src/features/profiles/domain/HealthProfile.js';

interface Account {
  id: string;
  displayName: string;
  familyId: string;
  healthProfileId: string | null;
}

// Kho giả trong bộ nhớ cho unit test; cạnh tranh đồng thời kiểm thử trên PostgreSQL thật.
export function createMemoryProfileRepository(accounts: Account[] = []): ProfileRepository {
  const profiles: HealthProfile[] = [];
  return {
    withFamily: async (familyId, work) => {
      const findAccount = (id: string) => accounts.find((a) => a.id === id && a.familyId === familyId);
      const findProfile = (id: string) => profiles.find((p) => p.id === id && p.familyId === familyId);
      const store: ProfileStore = {
        listProfiles: async () => profiles.filter((p) => p.familyId === familyId),
        listConsentAccounts: async () => accounts.filter((a) => a.familyId === familyId),
        listLinkableAccounts: async () =>
          accounts
            .filter((a) => a.familyId === familyId && !a.healthProfileId)
            .map(({ id, displayName }) => ({ id, displayName })),
        lockAccount: async (id) => findAccount(id) ?? null,
        insertProfile: async (input, receipt) => {
          const profile: HealthProfile = {
            id: `profile-${profiles.length}`,
            familyId,
            displayName: input.displayName,
            birthYear: input.birthYear,
            vitalsEnabled: null,
            consentConfirmedAt: null,
            consentConfirmedBy: null,
            consentBasis: null,
            consentStatus: 'pending',
            consentSource: null,
            consentRespondentName: null,
            consentWithdrawnAt: null,
            consentWithdrawnBy: null,
            createdAt: new Date('2026-10-06T00:00:00Z'),
            ...receipt,
          };
          profiles.push(profile);
          return profile;
        },
        linkAccount: async (id, profileId) => {
          findAccount(id)!.healthProfileId = profileId;
        },
        lockProfile: async (id) => findProfile(id) ?? null,
        updateProfile: async (id, patch) => Object.assign(findProfile(id)!, patch),
        findLinkedAccount: async (id) =>
          accounts.find((a) => a.familyId === familyId && a.healthProfileId === id) ?? null,
        saveConsentReceipt: async (id, receipt) => {
          const profile = findProfile(id)!;
          Object.assign(profile, receipt);
          return profile;
        },
        revokePendingInvitations: async () => {},
        deleteProfile: async (id) => {
          profiles.splice(
            profiles.findIndex((p) => p.id === id),
            1,
          );
        },
        enqueuePurge: async () => {},
      };
      return work(store);
    },
  };
}
