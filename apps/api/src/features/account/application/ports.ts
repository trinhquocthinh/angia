import type { SessionRepository } from '@src/shared/auth/application/ports.js';
import type { IdentityProvider, PasswordHasher } from '@src/shared/identity/application/ports.js';

import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';

export interface RegistrationGate {
  isOpen(): Promise<boolean>;
}

export interface CurrentLegalVersions {
  termsVersionId: string;
  privacyVersionId: string;
}

export interface LegalVersions {
  current(): Promise<CurrentLegalVersions>;
}

export type VerifiedInvitation =
  { kind: 'join_family'; familyId: string; role: 'main' | 'member' } | { kind: 'found_family' };

export interface InvitationVerifier {
  verify(token: string): Promise<VerifiedInvitation | null>;
}

export interface NewLocalAccountRecord {
  usernameNormalized: string;
  passwordHash: string;
  displayName: string;
  email?: string | null;
  invitationToken?: string | undefined;
  legalAcceptance: CurrentLegalVersions;
}

export interface RegisteredLocalAccount {
  id: string;
  username: string;
  displayName: string;
  familyId: string | null;
}

export type RegistrationWriteFailure =
  | {
      ok: false;
      code: 'ERR_USERNAME_TAKEN' | 'ERR_REGISTRATION_CLOSED' | 'ERR_NOT_FOUND' | 'ERR_DELETION_PENDING';
    }
  | { ok: false; code: 'ERR_LEGAL_VERSION_OUTDATED'; details: { current: CurrentLegalVersions } };

export type RegisterLocalAccountRecordOutcome =
  { ok: true; account: RegisteredLocalAccount } | RegistrationWriteFailure;

export interface AccountRegistrationUnitOfWork {
  isUsernameTaken(usernameNormalized: string): Promise<boolean>;
  register(record: NewLocalAccountRecord): Promise<RegisterLocalAccountRecordOutcome>;
}

export interface LocalAccountSession {
  sessionId: string;
  csrfToken: string;
  expiresAt: Date;
}

export interface RegisterLocalAccountDeps {
  gate: RegistrationGate;
  legalVersions: LegalVersions;
  invitationVerifier: InvitationVerifier;
  hasher: PasswordHasher;
  accounts: AccountRegistrationUnitOfWork;
  sessions: SessionRepository;
  generateToken: () => string;
  now: () => Date;
}

export type RegisterLocalAccountOutcome =
  | { ok: true; value: { account: RegisteredLocalAccount; session: LocalAccountSession } }
  | { ok: false; code: 'ERR_VALIDATION'; details: { field: string } }
  | { ok: false; code: 'ERR_REGISTRATION_CLOSED' }
  | { ok: false; code: 'ERR_LEGAL_VERSION_OUTDATED'; details: { current: CurrentLegalVersions } }
  | RegistrationWriteFailure;

export interface LocalLoginSessions {
  createIfCurrent(input: {
    accountId: string;
    expectedCredentialVersion: number;
    csrfToken: string;
    expiresAt: Date;
    passwordChangeRequired: boolean;
  }): Promise<{ ok: true; sessionId: string } | { ok: false; reason: 'gone' | 'locked' | 'stale' }>;
}

export interface LoginLocalAccountDeps {
  identity: IdentityProvider;
  localLoginSessions: LocalLoginSessions;
  passwordResetNotices: PasswordResetNotices;
  rateLimit: RateLimitDependencies;
  generateToken(): string;
  now(): Date;
}

export type LoginLocalAccountOutcome =
  | {
      ok: true;
      session: LocalAccountSession & { passwordChangeRequired: boolean; passwordResetBy: string | null };
    }
  | { ok: false; code: 'ERR_INVALID_CREDENTIALS' | 'ERR_ACCOUNT_LOCKED' }
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string }
  | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number };

interface LocalPasswordCredential {
  usernameNormalized: string;
  passwordHash: string;
  credentialVersion: number;
}

export interface LocalPasswordChanges {
  findCredential(accountId: string): Promise<LocalPasswordCredential | null>;
  replaceIfCurrent(input: {
    accountId: string;
    sessionId: string;
    expectedCredentialVersion: number;
    passwordHash: string;
    now: Date;
  }): Promise<{ ok: true } | { ok: false; reason: 'gone' | 'locked' | 'stale' }>;
}

export interface ChangeLocalPasswordDeps {
  passwords: LocalPasswordChanges;
  hasher: PasswordHasher;
  rateLimit: RateLimitDependencies;
  now(): Date;
}

export type ChangeLocalPasswordOutcome =
  | { ok: true }
  | { ok: false; code: 'ERR_INVALID_CREDENTIALS' | 'ERR_ACCOUNT_LOCKED' }
  | { ok: false; code: 'ERR_VALIDATION'; details: { field: string } }
  | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number }
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string };

interface EnrollmentAccount {
  oidcSubject: string | null;
  usernameNormalized: string | null;
  lockedAt: Date | null;
}

type EnrollmentInsertOutcome =
  { ok: true } | { ok: false; reason: 'gone' | 'locked' | 'forbidden' | 'exists' };

export interface LocalCredentialEnrollments {
  findAccount(accountId: string): Promise<EnrollmentAccount | null>;
  insertIfAbsent(input: {
    accountId: string;
    sessionId: string;
    passwordHash: string;
    now: Date;
  }): Promise<EnrollmentInsertOutcome>;
}

export interface EnrollLocalCredentialDeps {
  enrollmentEnabled: boolean;
  enrollments: LocalCredentialEnrollments;
  hasher: PasswordHasher;
  now(): Date;
}

export type EnrollLocalCredentialOutcome =
  | { ok: true }
  | {
      ok: false;
      code:
        | 'ERR_NOT_FOUND'
        | 'ERR_FORBIDDEN'
        | 'ERR_UNAUTHENTICATED'
        | 'ERR_ACCOUNT_LOCKED'
        | 'ERR_CREDENTIAL_ALREADY_SET';
    }
  | { ok: false; code: 'ERR_VALIDATION'; details: { field: 'password' } }
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string };

export interface PasswordResetNotices {
  findLatestActor(accountId: string): Promise<string | null>;
}

export interface MemberPasswordResetActor {
  accountId: string;
  familyId: string | null;
  role: 'main' | 'member' | null;
}

export type MemberPasswordResetFailure = {
  ok: false;
  code: 'ERR_FORBIDDEN' | 'ERR_OWNER_PROTECTED' | 'ERR_NOT_FOUND' | 'ERR_UNAUTHENTICATED';
};

export interface MemberPasswordResets {
  authorize(
    actor: MemberPasswordResetActor & { familyId: string },
    targetAccountId: string,
  ): Promise<{ ok: true; usernameNormalized: string | null } | MemberPasswordResetFailure>;
  reset(
    actor: MemberPasswordResetActor & { familyId: string },
    targetAccountId: string,
    input: { passwordHash: string; now: Date; expiresAt: Date },
  ): Promise<{ ok: true } | MemberPasswordResetFailure>;
}

export interface ResetMemberPasswordDeps {
  memberPasswordResets: MemberPasswordResets;
  hasher: PasswordHasher;
  now(): Date;
}

export type ResetMemberPasswordOutcome =
  | { ok: true; value: { temporaryPassword: string; expiresAt: Date } }
  | MemberPasswordResetFailure
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string };
