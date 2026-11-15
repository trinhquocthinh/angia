import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts } from '@src/shared/db/schema/index.js';
import type { LocalIdentityLifecycle } from '../application/LocalIdentityLifecycle.js';
import { revokeIdentityAccess } from './revokeIdentityAccess.js';
import { withLockedIdentityAccount } from './withLockedIdentityAccount.js';

export function createLocalIdentityLifecycle(db: Pick<Database, 'transaction'>): LocalIdentityLifecycle {
  return {
    lock: (id, reason, now) =>
      withLockedIdentityAccount(db, id, async (tx, familyId) => {
        await tx.update(accounts).set({ lockedAt: now, lockReason: reason }).where(eq(accounts.id, id));
        await revokeIdentityAccess(tx, id, familyId);
      }),
    unlock: (id) =>
      withLockedIdentityAccount(db, id, async (tx) => {
        await tx.update(accounts).set({ lockedAt: null, lockReason: null }).where(eq(accounts.id, id));
      }),
    revokeAll: (id) =>
      withLockedIdentityAccount(db, id, (tx, familyId) => revokeIdentityAccess(tx, id, familyId)),
    deleteUser: (id) =>
      withLockedIdentityAccount(db, id, async (tx, familyId) => {
        await revokeIdentityAccess(tx, id, familyId);
        await tx.delete(accounts).where(eq(accounts.id, id));
      }),
  };
}
