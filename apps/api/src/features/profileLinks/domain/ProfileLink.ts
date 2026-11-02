export interface ProfileLinkClaims {
  familyId: string;
  profileId: string;
  invitationId: string;
}
export type LinkDecision = 'accepted' | 'declined';
export interface ProfileLinkInvitation {
  id: string;
  familyId: string;
  profileId: string;
  tokenHash: string;
  invitedByAccountId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  acceptedAt: Date | null;
}
export interface LinkAccount {
  id: string;
  displayName: string;
  healthProfileId: string | null;
}
export interface LinkProfile {
  id: string;
  displayName: string;
  consentStatus: 'pending' | 'invited' | 'declined' | 'confirmed' | 'withdrawn';
  consentWithdrawnAt: Date | null;
}
export type ConsentPatch =
  | {
      consentStatus: 'confirmed';
      consentSource: 'self';
      consentBasis: 'self';
      consentRespondentName: string;
      consentConfirmedBy: string;
      consentConfirmedAt: Date;
    }
  | { consentStatus: 'withdrawn'; consentWithdrawnAt: Date; consentWithdrawnBy: string }
  | { consentStatus: 'declined' };
type ProfileLinkError = 'ERR_NOT_FOUND' | 'ERR_PROFILE_ALREADY_LINKED';
export type ProfileLinkOutcome<T, Code extends ProfileLinkError = ProfileLinkError> =
  { ok: true; value: T } | { ok: false; code: Code };
