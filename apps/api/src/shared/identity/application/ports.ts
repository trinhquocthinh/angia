export interface VerifiedIdentity {
  accountId: string;
  credentialVersion: number;
  lockedAt: Date | null;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: Date | null;
}

export interface CredentialIdentity extends VerifiedIdentity {
  passwordHash: string;
}

export interface IdentityProvider {
  verifyPassword(username: string, password: string): Promise<VerifiedIdentity | null>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
  needsRehash(hash: string): boolean;
}

export interface CredentialRepository {
  findByUsername(usernameNormalized: string): Promise<CredentialIdentity | null>;
  insert(accountId: string, passwordHash: string): Promise<number>;
  // Chỉ ghi nếu version còn khớp; caller điều phối khoá account/thu hồi phiên trong transaction.
  replace(accountId: string, passwordHash: string, expectedVersion: number): Promise<number | null>;
}
