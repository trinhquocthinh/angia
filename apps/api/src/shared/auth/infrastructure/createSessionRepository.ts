import { and, eq, gt } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, families, sessions } from '@src/shared/db/schema/index.js';
import type { SessionRepository } from '../application/ports.js';
import type { SessionContext } from '../domain/SessionContext.js';

// sessions/accounts/families không áp RLS (đọc trước khi biết nhóm) nên chạy thẳng trên role app.
export function createSessionRepository(db: Database): SessionRepository {
  return {
    async create(session) {
      const [row] = await db.insert(sessions).values(session).returning({ id: sessions.id });
      if (!row) {
        throw new Error('INSERT sessions không trả về dòng nào');
      }
      return row;
    },

    async findActive(sessionId, now) {
      const [row] = await db
        .select({
          sessionId: sessions.id,
          csrfToken: sessions.csrfToken,
          expiresAt: sessions.expiresAt,
          account: {
            id: accounts.id,
            displayName: accounts.displayName,
            isSystemAdmin: accounts.isSystemAdmin,
            healthProfileId: accounts.healthProfileId,
          },
          familyId: families.id,
          familyName: families.name,
          role: accounts.familyRole,
        })
        .from(sessions)
        .innerJoin(accounts, eq(accounts.id, sessions.accountId))
        .leftJoin(families, eq(families.id, accounts.familyId))
        .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
        .limit(1);
      if (!row) {
        return null;
      }
      const { familyId, familyName, ...rest } = row;
      const family = familyId !== null && familyName !== null ? { id: familyId, name: familyName } : null;
      return { ...rest, family } satisfies SessionContext;
    },

    async extend(sessionId, expiresAt) {
      await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, sessionId));
    },

    async delete(sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    },
  };
}
