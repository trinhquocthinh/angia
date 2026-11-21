import type { PasswordHasher } from '@src/shared/identity/application/ports.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { LocalPasswordChanges } from './ports.js';

export interface AccountEmailView {
  email: string | null;
  emailVerified: boolean;
  pendingEmail: string | null;
}

type EmailWriteFailure = {
  ok: false;
  code:
    | 'ERR_INVALID_CREDENTIALS'
    | 'ERR_ACCOUNT_LOCKED'
    | 'ERR_VALIDATION'
    | 'ERR_EMAIL_TAKEN'
    | 'ERR_VERIFICATION_TOKEN_INVALID';
};
export interface AccountEmails {
  change(input: {
    accountId: string;
    sessionId: string;
    expectedCredentialVersion: number;
    email: string;
  }): Promise<{ ok: true; value: AccountEmailView } | EmailWriteFailure>;
  // Kiểm lại hạn mức dưới khoá account; ghi hit, token và job trong cùng transaction.
  requestVerification(
    accountId: string,
    now: Date,
    rateLimit: RateLimitDependencies,
  ): Promise<
    | { ok: true; sent: boolean }
    | EmailWriteFailure
    | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number }
  >;
  confirmVerification(token: string, now: Date): Promise<{ ok: true } | EmailWriteFailure>;
}
export interface AccountEmailDeps {
  emails: AccountEmails;
  passwords: LocalPasswordChanges;
  hasher: PasswordHasher;
  rateLimit: RateLimitDependencies;
  now(): Date;
}
export type AccountEmailFailure =
  | EmailWriteFailure
  | { ok: false; code: 'ERR_VALIDATION'; details: { field: string } }
  | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number }
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string };
