import type { CurrentLegal, RegistrationRequest, RegistrationValues } from './ports';
export function prepareRegistration(values: RegistrationValues, legal: CurrentLegal): RegistrationRequest {
  return {
    username: values.username,
    password: values.password,
    displayName: values.displayName,
    ...(values.email.trim() ? { email: values.email.trim() } : {}),
    ageConfirmed: values.ageConfirmed,
    legalAcceptance: { termsVersionId: legal.terms.id, privacyVersionId: legal.privacy.id },
  };
}
