import type { ProfileLinkStore, ProfileLinkTokenCodec } from './ports.js';
import type {
  LinkAccount,
  LinkProfile,
  ProfileLinkClaims,
  ProfileLinkInvitation,
} from '../domain/ProfileLink.js';

export interface ActiveProfileLink {
  claims: ProfileLinkClaims;
  profile: LinkProfile;
  invitation: ProfileLinkInvitation;
  account: LinkAccount;
}
// Mọi lý do không dùng được (token sai/giả, hết hạn, đã dùng, thu hồi, tài khoản khác gia đình) đều trả null
// để gọi ra cùng một 404; lock hồ sơ → link → tài khoản phiên.
export async function findActiveProfileLink(
  store: ProfileLinkStore,
  codec: ProfileLinkTokenCodec,
  claims: ProfileLinkClaims,
  token: string,
  accountId: string,
  now: Date,
): Promise<ActiveProfileLink | null> {
  const profile = await store.lockProfile(claims.profileId);
  const invitation = await store.lockInvitation(claims);
  if (
    !profile ||
    !invitation ||
    invitation.tokenHash !== codec.hash(token) ||
    invitation.revokedAt !== null ||
    invitation.acceptedAt !== null ||
    invitation.expiresAt.getTime() <= now.getTime()
  )
    return null;
  const account = await store.lockAccount(accountId);
  return account ? { claims, profile, invitation, account } : null;
}
