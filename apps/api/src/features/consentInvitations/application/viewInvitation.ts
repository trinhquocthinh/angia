import type { InvitationDependencies } from './ports.js';
import type { Decision, InvitationOutcome } from '../domain/Invitation.js';
import { isInvitationActive } from './isInvitationActive.js';

interface InvitationView {
  profileDisplayName: string;
  inviterDisplayName: string | null;
  expiresAt: Date;
  status: 'pending' | Decision;
}
export async function viewInvitation(
  deps: InvitationDependencies,
  token: string,
): Promise<InvitationOutcome<InvitationView>> {
  const claims = deps.codec.verify(token);
  if (!claims) return { ok: false, code: 'ERR_NOT_FOUND' };
  return deps.repository.withFamily(claims.familyId, async (store) => {
    const profile = await store.lockProfile(claims.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    const invitation = await store.lockInvitation(claims);
    if (!isInvitationActive(invitation, deps.codec.hash(token), deps.now()))
      return { ok: false, code: 'ERR_NOT_FOUND' };
    return {
      ok: true,
      value: {
        profileDisplayName: profile.displayName,
        inviterDisplayName: await store.inviterName(invitation.invitedByAccountId),
        expiresAt: invitation.expiresAt,
        status: invitation.decision ?? 'pending',
      },
    };
  });
}
