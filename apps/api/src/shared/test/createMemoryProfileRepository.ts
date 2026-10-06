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
        listLinkableAccounts: async () =>
          accounts
            .filter((a) => a.familyId === familyId && !a.healthProfileId)
            .map(({ id, displayName }) => ({ id, displayName })),
        lockAccount: async (id) => findAccount(id) ?? null,
        insertProfile: async (input) => {
          const profile: HealthProfile = {
            id: `profile-${profiles.length}`,
            familyId,
            displayName: input.displayName,
            birthYear: input.birthYear ?? null,
            consentConfirmedAt: null,
            consentConfirmedBy: null,
            consentBasis: null,
            createdAt: new Date('2026-10-06T00:00:00Z'),
          };
          profiles.push(profile);
          return profile;
        },
        linkAccount: async (id, profileId) => {
          findAccount(id)!.healthProfileId = profileId;
        },
        lockProfile: async (id) => findProfile(id) ?? null,
        recordConsent: async (id, accountId, basis, at) => {
          const profile = findProfile(id)!;
          Object.assign(profile, {
            consentConfirmedBy: accountId,
            consentBasis: basis,
            consentConfirmedAt: at,
          });
          return profile;
        },
        confirmerName: async (id) => (id ? (findAccount(id)?.displayName ?? null) : null),
      };
      return work(store);
    },
  };
}
