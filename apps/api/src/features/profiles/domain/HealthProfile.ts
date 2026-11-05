import type { ConsentConfirmation } from './ConsentConfirmation.js';

type ConsentBasis = 'self' | 'guardian';
export type ConsentStatus = 'pending' | 'invited' | 'declined' | 'confirmed' | 'withdrawn';

export interface HealthProfile {
  id: string;
  familyId: string;
  displayName: string;
  birthYear: number | null;
  vitalsEnabled: boolean | null;
  consentConfirmedAt: Date | null;
  consentConfirmedBy: string | null;
  consentBasis: ConsentBasis | null;
  consentStatus: ConsentStatus;
  consentSource: 'legacy_attestation' | 'invitation' | 'main_attested' | 'self' | null;
  consentRespondentName: string | null;
  consentWithdrawnAt: Date | null;
  consentWithdrawnBy: string | null;
  createdAt: Date;
}

export interface NewProfile {
  displayName: string;
  birthYear: number;
  linkedAccountId?: string | undefined;
  consent?: ConsentConfirmation | undefined;
}

export interface LinkableAccount {
  id: string;
  displayName: string;
}
export interface LinkCandidate extends LinkableAccount {
  healthProfileId: string | null;
}
type ProfileError =
  | 'ERR_NOT_FOUND'
  | 'ERR_PROFILE_ALREADY_LINKED'
  | 'ERR_VALIDATION'
  | 'ERR_CONSENT_REQUIRED'
  | 'ERR_CONFIRMATION_MISMATCH'
  | 'ERR_CONSENT_INVITATION_REQUIRED';
export type ProfileOutcome<T, Code extends ProfileError = ProfileError> =
  { ok: true; value: T } | { ok: false; code: Code };
