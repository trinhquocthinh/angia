type ConsentBasis = 'self' | 'guardian';

export interface HealthProfile {
  id: string;
  familyId: string;
  displayName: string;
  birthYear: number | null;
  consentConfirmedAt: Date | null;
  consentConfirmedBy: string | null;
  consentBasis: ConsentBasis | null;
  consentStatus: 'pending' | 'invited' | 'declined' | 'confirmed';
  consentSource: 'legacy_attestation' | 'invitation' | null;
  consentRespondentName: string | null;
  createdAt: Date;
}

export interface NewProfile {
  displayName: string;
  birthYear?: number | undefined;
  linkedAccountId?: string | undefined;
}

export interface LinkableAccount {
  id: string;
  displayName: string;
}
export interface LinkCandidate extends LinkableAccount {
  healthProfileId: string | null;
}
type ProfileError = 'ERR_NOT_FOUND' | 'ERR_PROFILE_ALREADY_LINKED' | 'ERR_VALIDATION';
export type ProfileOutcome<T, Code extends ProfileError = ProfileError> =
  { ok: true; value: T } | { ok: false; code: Code };
