import { eq, sql } from 'drizzle-orm';
import type { LocalCredentialLookup } from '@src/shared/auth/application/ports.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials } from '@src/shared/db/schema/index.js';

// accounts/account_credentials không áp RLS; đọc bằng role app như repository phiên.
export function createLocalCredentialLookup(db: Database): LocalCredentialLookup {
  return async (accountId) => {
    const [row] = await db
      .select({
        credentialAccountId: accountCredentials.accountId,
        email: accounts.email,
        emailVerified: sql<boolean>`${accounts.emailVerifiedAt} IS NOT NULL`,
        pendingEmail: accounts.pendingEmail,
      })
      .from(accounts)
      .leftJoin(accountCredentials, eq(accountCredentials.accountId, accounts.id))
      .where(eq(accounts.id, accountId))
      .limit(1);
    return {
      hasLocalCredential: row?.credentialAccountId != null,
      email: row?.email ?? null,
      emailVerified: row?.emailVerified ?? false,
      pendingEmail: row?.pendingEmail ?? null,
    };
  };
}
