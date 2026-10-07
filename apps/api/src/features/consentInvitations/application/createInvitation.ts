import type { InvitationDependencies } from './ports.js';
import type { InvitationOutcome } from '../domain/Invitation.js';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
export async function createInvitation(
  deps: InvitationDependencies,
  familyId: string,
  profileId: string,
  invitedByAccountId: string,
): Promise<InvitationOutcome<{ token: string; expiresAt: Date }>> {
  return deps.repository.withFamily(familyId, async (store) => {
    const profile = await store.lockProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus === 'confirmed') return { ok: false, code: 'ERR_CONSENT_ALREADY_CONFIRMED' };
    const id = deps.newId();
    const token = deps.codec.issue({ familyId, profileId, invitationId: id });
    const at = deps.now();
    const expiresAt = new Date(at.getTime() + SEVEN_DAYS);
    await store.revokePending(profileId, at);
    await store.insertInvitation({
      id,
      familyId,
      profileId,
      invitedByAccountId,
      expiresAt,
      tokenHash: deps.codec.hash(token),
      revokedAt: null,
      decision: null,
      respondentName: null,
      basis: null,
      respondedAt: null,
    });
    await store.setStatus(profileId, 'invited');
    return { ok: true, value: { token, expiresAt } };
  });
}
