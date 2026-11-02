import type {
  ConsentPatch,
  LinkAccount,
  LinkDecision,
  LinkProfile,
  ProfileLinkClaims,
  ProfileLinkInvitation,
} from '../domain/ProfileLink.js';

export interface ProfileLinkTokenCodec {
  issue(claims: ProfileLinkClaims): string;
  verify(token: string): ProfileLinkClaims | null;
  hash(token: string): string;
}
interface LinkEvent {
  profileId: string;
  actorAccountId: string;
  toAccountId: string;
  at: Date;
}
// Chạy trong withFamilyScope; luôn khóa hồ sơ trước link để các luồng tạo/thu hồi/xác nhận không khóa chéo.
export interface ProfileLinkStore {
  lockProfile(id: string): Promise<LinkProfile | null>;
  findLinkedAccount(profileId: string): Promise<{ id: string } | null>;
  lockInvitation(claims: ProfileLinkClaims): Promise<ProfileLinkInvitation | null>;
  lockAccount(id: string): Promise<LinkAccount | null>;
  accountName(id: string | null): Promise<string | null>;
  revokePending(profileId: string, at: Date): Promise<void>;
  insertInvitation(invitation: ProfileLinkInvitation): Promise<void>;
  markDecided(invitationId: string, accountId: string, decision: LinkDecision, at: Date): Promise<void>;
  applyConsent(profileId: string, patch: ConsentPatch): Promise<void>;
  linkAccount(accountId: string, profileId: string): Promise<void>;
  clearReminderRecipients(profileId: string): Promise<void>;
  revokeConsentInvitations(profileId: string, at: Date): Promise<void>;
  recordLinkEvent(event: LinkEvent): Promise<void>;
}
export interface ProfileLinkRepository {
  withFamily<T>(familyId: string, work: (store: ProfileLinkStore) => Promise<T>): Promise<T>;
}
export interface ProfileLinkDependencies {
  repository: ProfileLinkRepository;
  codec: ProfileLinkTokenCodec;
  now(): Date;
  newId(): string;
  appBaseUrl: string;
}
