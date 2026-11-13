import type { SessionRepository } from '@src/shared/auth/application/ports.js';
import type { PasswordHasher } from '@src/shared/identity/application/ports.js';

export type { PasswordHasher, SessionRepository };

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

export interface VerifiedInvitation {
  familyId: string;
  role: 'main' | 'member';
}

export interface InvitationVerifier {
  verify(token: string): Promise<VerifiedInvitation | null>;
}

export interface NewLocalAccountRecord {
  usernameNormalized: string;
  passwordHash: string;
  displayName: string;
  email?: string | null;
  familyId?: string | null;
  familyRole?: 'main' | 'member' | null;
  legalAcceptance: CurrentLegalVersions;
}

export interface RegisteredLocalAccount {
  id: string;
  username: string;
  displayName: string;
  familyId: string | null;
}

export type RegisterLocalAccountRecordOutcome =
  { ok: true; account: RegisteredLocalAccount } | { ok: false; code: 'ERR_USERNAME_TAKEN' };

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
  | { ok: false; code: 'ERR_USERNAME_TAKEN' };
