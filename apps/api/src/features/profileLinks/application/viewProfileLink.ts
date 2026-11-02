import type { ProfileLinkDependencies } from './ports.js';
import type { ProfileLinkOutcome } from '../domain/ProfileLink.js';
import { findActiveProfileLink } from './findActiveProfileLink.js';

interface ProfileLinkView {
  profileName: string;
  inviterName: string | null;
  expiresAt: Date;
  canAccept: boolean;
  reason: 'account_already_linked' | 'profile_already_linked' | null;
  consentNote: 'withdrawn_before' | null;
}
export async function viewProfileLink(
  deps: ProfileLinkDependencies,
  token: string,
  accountId: string,
): Promise<ProfileLinkOutcome<ProfileLinkView, 'ERR_NOT_FOUND'>> {
  const claims = deps.codec.verify(token);
  if (!claims) return { ok: false, code: 'ERR_NOT_FOUND' };
  return deps.repository.withFamily(claims.familyId, async (store) => {
    const active = await findActiveProfileLink(store, deps.codec, claims, token, accountId, deps.now());
    if (!active) return { ok: false, code: 'ERR_NOT_FOUND' };
    const reason = active.account.healthProfileId
      ? 'account_already_linked'
      : (await store.findLinkedAccount(claims.profileId))
        ? 'profile_already_linked'
        : null;
    return {
      ok: true,
      value: {
        profileName: active.profile.displayName,
        inviterName: await store.accountName(active.invitation.invitedByAccountId),
        expiresAt: active.invitation.expiresAt,
        canAccept: reason === null,
        reason,
        consentNote: active.profile.consentWithdrawnAt ? 'withdrawn_before' : null,
      },
    };
  });
}
