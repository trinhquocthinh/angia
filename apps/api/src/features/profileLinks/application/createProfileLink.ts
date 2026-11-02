import type { ProfileLinkDependencies } from './ports.js';
import type { ProfileLinkOutcome } from '../domain/ProfileLink.js';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
export async function createProfileLink(
  deps: ProfileLinkDependencies,
  familyId: string,
  profileId: string,
  invitedByAccountId: string,
): Promise<ProfileLinkOutcome<{ url: string; expiresAt: Date }>> {
  return deps.repository.withFamily(familyId, async (store) => {
    if (!(await store.lockProfile(profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (await store.findLinkedAccount(profileId)) return { ok: false, code: 'ERR_PROFILE_ALREADY_LINKED' };
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
      acceptedAt: null,
    });
    return { ok: true, value: { url: `${deps.appBaseUrl}/link-invite#token=${token}`, expiresAt } };
  });
}
