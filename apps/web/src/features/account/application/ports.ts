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
export type RegistrationValues = Pick<RegistrationRequest, 'username' | 'password'> & {
  displayName: string;
  email: string;
  ageConfirmed: boolean;
  legalAgreed: boolean;
};

type AccountActionPath = '/api/me/password' | '/api/me/local-credential' | '/api/me/legal-acceptances';
type AccountActionBody = { newPassword: string } | { password: string } | { versionIds: string[] };
export type SubmitAccountAction = (
  path: AccountActionPath,
  body: AccountActionBody,
  csrfToken: string,
) => Promise<AccountResult<void>>;

export type PasswordResetRequest = components['schemas']['RequestPasswordResetRequest'];
export type SubmitPasswordResetRequest = (
  body: PasswordResetRequest,
) => Promise<AccountResult<components['schemas']['RequestPasswordResetResponse']>>;

type PasswordResetSubmission = components['schemas']['ResetPasswordRequest'];
export type SubmitPasswordReset = (body: PasswordResetSubmission) => Promise<AccountResult<void>>;

type EmailVerificationConfirm = components['schemas']['ConfirmEmailVerificationRequest'];
export type SubmitEmailVerificationConfirm = (body: EmailVerificationConfirm) => Promise<AccountResult<void>>;

export type AccountEmailStatus = components['schemas']['AccountEmailResponse'];
export type ChangeAccountEmailBody = components['schemas']['ChangeAccountEmailRequest'];
export type SubmitAccountEmailChange = (
  body: ChangeAccountEmailBody,
  csrfToken: string,
) => Promise<AccountResult<AccountEmailStatus>>;

type EmailVerificationRequestOutcome = { sent: true } | { alreadyVerified: true };
export type SubmitEmailVerificationRequest = (
  csrfToken: string,
) => Promise<AccountResult<EmailVerificationRequestOutcome>>;
