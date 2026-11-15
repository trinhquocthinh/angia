import type { AccountFailure, RegistrationValues } from './ports';
export function registrationErrorField(result: AccountFailure): keyof RegistrationValues | null {
  if (result.code === 'ERR_USERNAME_TAKEN') return 'username';
  if (result.code !== 'ERR_VALIDATION') return null;
  const fields: Record<string, keyof RegistrationValues> = {
    username: 'username',
    password: 'password',
    displayName: 'displayName',
    email: 'email',
    ageConfirmed: 'ageConfirmed',
    legalAcceptance: 'legalAgreed',
  };
  return fields[result.field ?? ''] ?? null;
}
