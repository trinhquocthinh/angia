import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts } from '@src/shared/db/schema/index.js';
import type { AccountRepository } from '../application/ports.js';

// accounts không áp RLS (tra cứu trước khi biết nhóm) nên chạy thẳng trên role app, không qua withFamilyScope.
export function createAccountRepository(db: Database): AccountRepository {
  return {
    async upsertFromIdentity(identity) {
      const [row] = await db
        .insert(accounts)
        .values(identity)
        .onConflictDoUpdate({
          target: accounts.oidcSubject,
          set: { displayName: identity.displayName, isSystemAdmin: identity.isSystemAdmin },
        })
        .returning({ id: accounts.id });
      if (!row) {
        throw new Error('Upsert accounts không trả về dòng nào');
      }
      return row;
    },
  };
}
