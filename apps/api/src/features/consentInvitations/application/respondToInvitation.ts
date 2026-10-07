import type { InvitationDependencies } from './ports.js';
import type { InvitationOutcome, InvitationResponse, ResponseReceipt } from '../domain/Invitation.js';
import { isInvitationActive } from './isInvitationActive.js';

export async function respondToInvitation(
  deps: InvitationDependencies,
  token: string,
  response: InvitationResponse,
): Promise<InvitationOutcome<ResponseReceipt>> {
  const claims = deps.codec.verify(token);
  if (!claims) return { ok: false, code: 'ERR_NOT_FOUND' };
  return deps.repository.withFamily(claims.familyId, async (store) => {
    const profile = await store.lockProfile(claims.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    const invitation = await store.lockInvitation(claims);
    const at = deps.now();
    if (!isInvitationActive(invitation, deps.codec.hash(token), at))
      return { ok: false, code: 'ERR_NOT_FOUND' };
    if (invitation.decision && invitation.respondentName && invitation.basis && invitation.respondedAt) {
      return {
        ok: true,
        value: {
          outcome: 'already_responded',
          decision: invitation.decision,
          respondentName: invitation.respondentName,
          basis: invitation.basis,
          respondedAt: invitation.respondedAt,
        },
      };
    }
    await store.recordResponse(invitation, response, at);
    return { ok: true, value: { outcome: 'recorded', ...response, respondedAt: at } };
  });
}
