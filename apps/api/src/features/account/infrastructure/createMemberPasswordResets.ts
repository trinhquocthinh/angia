import { eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, accountCredentials, sessions } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { lockFamilyMemberChange } from '@src/shared/auth/infrastructure/lockFamilyMemberChange.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { MemberPasswordResets } from '../application/ports.js';

export function createMemberPasswordResets(db: Database): MemberPasswordResets {
  return {
    authorize: (actor, targetId) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const result = await lockFamilyMemberChange(tx, actor, targetId);
        if (!result.ok) return result;
        return { ok: true, usernameNormalized: result.target.usernameNormalized };
      }),
    reset: (actor, targetId, input) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const result = await lockFamilyMemberChange(tx, actor, targetId);
        if (!result.ok) return result;
        await tx
          .insert(accountCredentials)
          .values({
            accountId: targetId,
            passwordHash: input.passwordHash,
            updatedAt: input.now,
          })
          .onConflictDoUpdate({
            target: accountCredentials.accountId,
            set: {
              passwordHash: input.passwordHash,
              credentialVersion: sql`${accountCredentials.credentialVersion} + 1`,
              updatedAt: input.now,
            },
          });
        await tx
          .update(accounts)
          .set({ mustChangePassword: true, tempPasswordExpiresAt: input.expiresAt })
          .where(eq(accounts.id, targetId));
        await tx.delete(sessions).where(eq(sessions.accountId, targetId));
        await writeAdminAuditEvent(tx, {
          action: 'password_reset_by_family',
          actorAccountId: actor.accountId,
          familyId: actor.familyId,
          targetAccountId: targetId,
        });
        return { ok: true };
      }),
  };
}
