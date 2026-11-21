import { normalizeEmail } from './normalizeEmail.js';
import { validateNewPassword } from './validateNewPassword.js';
import type { RegistrationInput, RegistrationValidationOutcome } from './RegistrationInput.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME_REGEX = /^[a-z0-9._-]{3,32}$/;

export function validateRegistrationInput(input: RegistrationInput): RegistrationValidationOutcome {
  if (input.ageConfirmed !== true) {
    return { ok: false, code: 'ERR_VALIDATION', details: { field: 'ageConfirmed' } };
  }
  const usernameNormalized = input.username?.trim().toLowerCase() ?? '';
  if (!USERNAME_REGEX.test(usernameNormalized)) {
    return { ok: false, code: 'ERR_VALIDATION', details: { field: 'username' } };
  }
  const password = input.password ?? '';
  if (!validateNewPassword(password, usernameNormalized)) {
    return { ok: false, code: 'ERR_VALIDATION', details: { field: 'password' } };
  }
  const displayName = input.displayName?.trim() ?? '';
  if (displayName.length < 1 || displayName.length > 60) {
    return { ok: false, code: 'ERR_VALIDATION', details: { field: 'displayName' } };
  }
  if (input.email !== undefined && input.email !== null) {
    if (normalizeEmail(input.email) === null) {
      return { ok: false, code: 'ERR_VALIDATION', details: { field: 'email' } };
    }
  }
  if (input.invitationToken !== undefined && input.invitationToken.length > 512) {
    return { ok: false, code: 'ERR_VALIDATION', details: { field: 'invitationToken' } };
  }
  if (!isValidLegalAcceptance(input.legalAcceptance)) {
    return { ok: false, code: 'ERR_VALIDATION', details: { field: 'legalAcceptance' } };
  }
  return {
    ok: true,
    value: {
      usernameNormalized,
      password,
      displayName,
      email: input.email == null ? undefined : normalizeEmail(input.email)!,
      ageConfirmed: true,
      legalAcceptance: {
        termsVersionId: input.legalAcceptance.termsVersionId,
        privacyVersionId: input.legalAcceptance.privacyVersionId,
      },
      invitationToken: input.invitationToken?.trim() || undefined,
    },
  };
}

function isValidLegalAcceptance(legal: RegistrationInput['legalAcceptance']): boolean {
  if (!legal) return false;
  return UUID_REGEX.test(legal.termsVersionId) && UUID_REGEX.test(legal.privacyVersionId);
}
