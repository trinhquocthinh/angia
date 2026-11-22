import type { PasswordHasher } from '@src/shared/identity/application/ports.js';
import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';

export interface EmailPasswordResets {
  request(normalizedEmail: string, now: Date): Promise<void>;
  findValid(
    token: string,
    now: Date,
  ): Promise<{ accountId: string; usernameNormalized: string | null } | null>;
  consume(token: string, accountId: string, passwordHash: string, now: Date): Promise<boolean>;
}
export interface EmailPasswordResetDeps {
  emailPasswordResets: EmailPasswordResets;
  hasher: PasswordHasher;
  rateLimit: RateLimitDependencies;
  now(): Date;
  runInBackground?: (task: () => Promise<void>) => void;
}
export type PasswordResetOutcome =
  | { ok: true }
  | { ok: false; code: 'ERR_RESET_TOKEN_INVALID' }
  | { ok: false; code: 'ERR_VALIDATION'; details: { field: 'newPassword' } }
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string }
  | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number };
