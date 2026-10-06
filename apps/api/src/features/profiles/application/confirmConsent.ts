import type { ConsentBasis, ConsentConfirmation, ProfileOutcome } from '../domain/HealthProfile.js';
import type { Clock, ProfileRepository } from './ports.js';

export async function confirmConsent(
  repository: ProfileRepository,
  familyId: string,
  profileId: string,
  accountId: string,
  basis: ConsentBasis,
  now: Clock,
): Promise<ProfileOutcome<ConsentConfirmation, 'ERR_NOT_FOUND'>> {
  return repository.withFamily(familyId, async (store) => {
    const existing = await store.lockProfile(profileId);
    if (!existing) return { ok: false, code: 'ERR_NOT_FOUND' };
    const outcome = existing.consentConfirmedAt ? 'already_confirmed' : 'confirmed';
    const profile =
      outcome === 'confirmed' ? await store.recordConsent(profileId, accountId, basis, now()) : existing;
    return {
      ok: true,
      value: {
        outcome,
        profile,
        confirmedByDisplayName: await store.confirmerName(profile.consentConfirmedBy),
      },
    };
  });
}
