import type { ProfileLinkDependencies } from './ports.js';
import type { LinkDecision, ProfileLinkOutcome } from '../domain/ProfileLink.js';
import { decideLinkConsent } from '../domain/decideLinkConsent.js';
import { findActiveProfileLink } from './findActiveProfileLink.js';

interface ProfileLinkReceipt {
  outcome: 'linked' | 'declined';
  profileId: string;
  profileName: string;
  consentStatus: 'pending' | 'invited' | 'declined' | 'confirmed' | 'withdrawn';
}
export async function acceptProfileLink(
  deps: ProfileLinkDependencies,
  token: string,
  accountId: string,
  decision: LinkDecision,
): Promise<ProfileLinkOutcome<ProfileLinkReceipt>> {
  const claims = deps.codec.verify(token);
  if (!claims) return { ok: false, code: 'ERR_NOT_FOUND' };
  return deps.repository.withFamily(claims.familyId, async (store) => {
    const at = deps.now();
    const active = await findActiveProfileLink(store, deps.codec, claims, token, accountId, at);
    if (!active) return { ok: false, code: 'ERR_NOT_FOUND' };
    const { profile, account, invitation } = active;
    if (account.healthProfileId || (await store.findLinkedAccount(profile.id)))
      return { ok: false, code: 'ERR_PROFILE_ALREADY_LINKED' };
    const patch = decideLinkConsent(profile, decision, account, at);
    if (patch) await store.applyConsent(profile.id, patch);
    await store.markDecided(invitation.id, account.id, decision, at);
    await store.revokeConsentInvitations(profile.id, at);
    if (decision === 'accepted') {
      await store.linkAccount(account.id, profile.id);
      await store.clearReminderRecipients(profile.id);
      await store.recordLinkEvent({
        profileId: profile.id,
        action: 'link',
        actorAccountId: account.id,
        actorRole: 'invitee',
        fromAccountId: null,
        toAccountId: account.id,
        at,
      });
    }
    return {
      ok: true,
      value: {
        outcome: decision === 'accepted' ? 'linked' : 'declined',
        profileId: profile.id,
        profileName: profile.displayName,
        consentStatus: patch?.consentStatus ?? profile.consentStatus,
      },
    };
  });
}
