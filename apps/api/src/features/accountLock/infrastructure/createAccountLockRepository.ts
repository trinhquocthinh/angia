import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import { revokeIdentityAccess } from '@src/shared/identity/infrastructure/revokeIdentityAccess.js';
import type { AccountLockRepository } from '../application/ports.js';
import { readAdminAccount } from './readAdminAccount.js';

export function createAccountLockRepository(db: Database): AccountLockRepository {
  return {
    get: (id) => readAdminAccount(db, id),
    lock: (actorAccountId, id, reason) =>
      db.transaction(async (tx) => {
        const account = await lockActiveAccount(tx, id);
        if (!account) return null;
        await tx
          .update(accounts)
          .set({ lockedAt: sql`now()`, lockReason: reason })
          .where(eq(accounts.id, id));
        await revokeIdentityAccess(tx, id, account.familyId);
        await writeAdminAuditEvent(tx, {
          actorAccountId,
          action: 'account_locked',
          targetAccountId: id,
          ...(account.familyId ? { familyId: account.familyId } : {}),
        });
        return readAdminAccount(tx, id);
      }),
    unlock: (actorAccountId, id) =>
      db.transaction(async (tx) => {
        const account = await lockActiveAccount(tx, id);
        if (!account) return null;
        await tx.update(accounts).set({ lockedAt: null, lockReason: null }).where(eq(accounts.id, id));
        await writeAdminAuditEvent(tx, {
          actorAccountId,
          action: 'account_unlocked',
          targetAccountId: id,
          ...(account.familyId ? { familyId: account.familyId } : {}),
        });
        return readAdminAccount(tx, id);
      }),
  };
}

// Cùng khoá dòng với cấp phiên; đọc lại nhà hiện tại trước khi thu hồi Push.
async function lockActiveAccount(tx: FamilyScopedTx, id: string) {
  const [account] = await tx
    .select({ familyId: accounts.familyId })
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .for('update');
  return account;
}
