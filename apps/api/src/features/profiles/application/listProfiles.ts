import type { ProfileRepository } from './ports.js';
import { profileConsentAction } from './profileConsentAction.js';

export function listProfiles(repository: ProfileRepository, familyId: string, actorId: string) {
  return repository.withFamily(familyId, async (store) => {
    const profiles = await store.listProfiles();
    const accounts = await store.listConsentAccounts();
    const names = new Map(accounts.map((a) => [a.id, a.displayName]));
    const linked = new Map(
      accounts.filter((a) => a.healthProfileId !== null).map((a) => [a.healthProfileId, a.id]),
    );
    return profiles.map((profile) => ({
      ...profile,
      consentAction: profileConsentAction(profile, linked.get(profile.id) ?? null, actorId),
      consentConfirmedByName: profile.consentConfirmedBy
        ? (names.get(profile.consentConfirmedBy) ?? null)
        : null,
    }));
  });
}
