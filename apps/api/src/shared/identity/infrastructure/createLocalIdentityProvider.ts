import { randomBytes } from 'node:crypto';
import type { CredentialRepository, IdentityProvider, PasswordHasher } from '../application/ports.js';

export async function createLocalIdentityProvider(
  credentials: Pick<CredentialRepository, 'findByUsername'>,
  hasher: PasswordHasher,
): Promise<IdentityProvider> {
  const dummyHash = await hasher.hash(randomBytes(32).toString('hex'));
  return {
    async verifyPassword(username, password) {
      const credential = await credentials.findByUsername(username.toLowerCase());
      const valid = await hasher.verify(credential?.passwordHash ?? dummyHash, password);
      if (!credential || !valid) return null;
      // Chỉ cho phép các trường snapshot; không lan hash/trường riêng tư từ repository.
      return {
        accountId: credential.accountId,
        credentialVersion: credential.credentialVersion,
        lockedAt: credential.lockedAt,
        mustChangePassword: credential.mustChangePassword,
        tempPasswordExpiresAt: credential.tempPasswordExpiresAt,
      };
    },
  };
}
