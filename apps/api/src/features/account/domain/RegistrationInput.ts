export interface RegistrationLegalAcceptance {
  termsVersionId: string;
  privacyVersionId: string;
}

export interface RegistrationInput {
  username: string;
  password: string;
  displayName: string;
  email?: string | undefined;
  ageConfirmed: boolean;
  legalAcceptance: RegistrationLegalAcceptance;
  invitationToken?: string | undefined;
}

export interface ValidatedRegistrationInput {
  usernameNormalized: string;
  password: string;
  displayName: string;
  email?: string | undefined;
  ageConfirmed: true;
  legalAcceptance: RegistrationLegalAcceptance;
  invitationToken?: string | undefined;
}

export type RegistrationValidationOutcome =
  | { ok: true; value: ValidatedRegistrationInput }
  | { ok: false; code: 'ERR_VALIDATION'; details: { field: string } };
