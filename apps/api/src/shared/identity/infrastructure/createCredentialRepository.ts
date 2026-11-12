import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accountCredentials, accounts } from '@src/shared/db/schema/index.js';
import type { CredentialRepository } from '../application/ports.js';

// Tra trước khi biết nhà; dùng role app, nhận cả transaction ngoài để ghi cùng account/legal.
export function createCredentialRepository(
  db: Pick<Database, 'select' | 'insert' | 'update'>,
): CredentialRepository {
  return {
    async findByUsername(usernameNormalized) {
      const [row] = await db
        .select({
          accountId: accounts.id,
          passwordHash: accountCredentials.passwordHash,
          credentialVersion: accountCredentials.credentialVersion,
          lockedAt: accounts.lockedAt,
          mustChangePassword: accounts.mustChangePassword,
          tempPasswordExpiresAt: accounts.tempPasswordExpiresAt,
        })
        .from(accounts)
        .innerJoin(accountCredentials, eq(accountCredentials.accountId, accounts.id))
        .where(eq(accounts.usernameNormalized, usernameNormalized));
      return row ?? null;
    },
    async insert(accountId, passwordHash) {
      const [row] = await db
        .insert(accountCredentials)
        .values({ accountId, passwordHash })
        .returning({ version: accountCredentials.credentialVersion });
      if (!row) throw new Error('INSERT account_credentials không trả về dòng nào');
      return row.version;
    },
    async replace(accountId, passwordHash, expectedVersion) {
      const [row] = await db
        .update(accountCredentials)
        .set({
          passwordHash,
          credentialVersion: sql`${accountCredentials.credentialVersion} + 1`,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(accountCredentials.accountId, accountId),
            eq(accountCredentials.credentialVersion, expectedVersion),
          ),
        )
        .returning({ version: accountCredentials.credentialVersion });
      return row?.version ?? null;
    },
  };
}
