import type { components, paths } from '@src/shared/api/schema.gen';
export type CurrentLegal =
  paths['/api/legal/current']['get']['responses'][200]['content']['application/json'];
export type AccountFailure = { ok: false; code: string; field?: string; current?: unknown; status?: number };
export type AccountResult<T> = { ok: true; data: T } | AccountFailure;
export type LoginRequest = components['schemas']['PasswordLoginRequest'];
export type RegistrationRequest = components['schemas']['RegisterAccountRequest'];
export type SubmitPasswordLogin = (
  body: LoginRequest,
) => Promise<AccountResult<components['schemas']['PasswordLoginResponse']>>;
export type SubmitRegistration = (
  body: RegistrationRequest,
) => Promise<AccountResult<components['schemas']['RegisterAccountResponse']>>;
export type FetchCurrentLegal = () => Promise<AccountResult<CurrentLegal>>;
export type RegistrationValues = LoginRequest & {
  displayName: string;
  email: string;
  ageConfirmed: boolean;
  legalAgreed: boolean;
};

export type AccountActionPath = '/api/me/password' | '/api/me/local-credential' | '/api/me/legal-acceptances';
export type AccountActionBody = { newPassword: string } | { password: string } | { versionIds: string[] };
export type SubmitAccountAction = (
  path: AccountActionPath,
  body: AccountActionBody,
  csrfToken: string,
) => Promise<AccountResult<void>>;
