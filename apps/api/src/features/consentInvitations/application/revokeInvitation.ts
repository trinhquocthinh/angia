import type { InvitationDependencies } from './ports.js';
import type { InvitationOutcome } from '../domain/Invitation.js';

export async function revokeInvitation(
  deps: InvitationDependencies,
  familyId: string,
  profileId: string,
): Promise<InvitationOutcome<{ status: 'pending' }>> {
  return deps.repository.withFamily(familyId, async (store) => {
    const profile = await store.lockProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus === 'confirmed') return { ok: false, code: 'ERR_CONSENT_ALREADY_CONFIRMED' };
    await store.revokePending(profileId, deps.now());
    await store.setStatus(profileId, 'pending');
    return { ok: true, value: { status: 'pending' } };
  });
}
