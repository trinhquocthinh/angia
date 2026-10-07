export interface InvitationClaims {
  familyId: string;
  profileId: string;
  invitationId: string;
}
export type Decision = 'accepted' | 'declined';
type Basis = 'self' | 'guardian';
export interface InvitationResponse {
  decision: Decision;
  respondentName: string;
  basis: Basis;
}
export interface Invitation extends InvitationResponseFields {
  id: string;
  familyId: string;
  profileId: string;
  tokenHash: string;
  invitedByAccountId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}
interface InvitationResponseFields {
  decision: Decision | null;
  respondentName: string | null;
  basis: Basis | null;
  respondedAt: Date | null;
}
type InvitationError = 'ERR_NOT_FOUND' | 'ERR_CONSENT_ALREADY_CONFIRMED';
export type InvitationOutcome<T> = { ok: true; value: T } | { ok: false; code: InvitationError };
export interface ResponseReceipt extends InvitationResponse {
  outcome: 'recorded' | 'already_responded';
  respondedAt: Date;
}
