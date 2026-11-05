import type { ProfileLinkDependencies } from './ports.js';
import type { ProfileLinkOutcome } from '../domain/ProfileLink.js';

export async function revokeProfileLink(
  deps: ProfileLinkDependencies,
  familyId: string,
  profileId: string,
): Promise<ProfileLinkOutcome<null, 'ERR_NOT_FOUND'>> {
  return deps.repository.withFamily(familyId, async (store) => {
    if (!(await store.lockProfile(profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    await store.revokePending(profileId, deps.now());
    return { ok: true, value: null };
  });
}
