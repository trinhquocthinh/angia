import type { ConsentConfirmation } from '../domain/ConsentConfirmation.js';
import { createConsentReceipt } from '../domain/createConsentReceipt.js';
import type { HealthProfile, ProfileOutcome } from '../domain/HealthProfile.js';
import type { Clock, ProfileRepository } from './ports.js';

export async function confirmProfileConsent(
  repository: ProfileRepository,
  familyId: string,
  actorId: string,
  profileId: string,
  consent: ConsentConfirmation,
  now: Clock,
): Promise<ProfileOutcome<HealthProfile>> {
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.lockProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    const linked = await store.findLinkedAccount(profileId);
    if (profile.consentWithdrawnAt !== null || (linked && linked.id !== actorId)) {
      return { ok: false, code: 'ERR_CONSENT_INVITATION_REQUIRED' };
    }
    if (
      (consent.kind === 'attestation' && linked !== null) ||
      (consent.kind === 'self' && linked?.id !== actorId)
    ) {
      return { ok: false, code: 'ERR_VALIDATION' };
    }
    if (profile.consentStatus === 'confirmed') return { ok: true, value: profile };
    const at = now();
    const receipt = createConsentReceipt(
      consent,
      linked?.id ?? null,
      { id: actorId, displayName: linked?.displayName ?? null },
      at,
    );
    if (!receipt.ok) return receipt;
    if (!receipt.value) return { ok: false, code: 'ERR_VALIDATION' };
    const confirmed = await store.saveConsentReceipt(profileId, receipt.value);
    await store.revokePendingInvitations(profileId, at);
    return { ok: true, value: confirmed };
  });
}
