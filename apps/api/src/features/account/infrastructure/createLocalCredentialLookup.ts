import { eq } from 'drizzle-orm';
import type { LocalCredentialLookup } from '@src/shared/auth/application/ports.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials } from '@src/shared/db/schema/index.js';

// accounts/account_credentials không áp RLS; đọc bằng role app như repository phiên.
export function createLocalCredentialLookup(db: Database): LocalCredentialLookup {
  return async (accountId) => {
    const [row] = await db
      .select({ credentialAccountId: accountCredentials.accountId })
      .from(accounts)
      .leftJoin(accountCredentials, eq(accountCredentials.accountId, accounts.id))
      .where(eq(accounts.id, accountId))
      .limit(1);
    return { hasLocalCredential: row?.credentialAccountId != null };
  };
}
