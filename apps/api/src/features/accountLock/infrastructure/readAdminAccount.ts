import { and, eq, isNull } from 'drizzle-orm';
import type { AdminAccountDetail } from '@angia/contracts';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Database } from '@src/shared/db/createDatabase.js';

// Liệt kê rõ năm trường để không đưa thông tin nhạy cảm qua port.
export async function readAdminAccount(
  db: Database | FamilyScopedTx,
  accountId: string,
): Promise<AdminAccountDetail | null> {
  const [row] = await db
    .select({
      id: accounts.id,
      username: accounts.usernameNormalized,
      displayName: accounts.displayName,
      familyName: families.name,
      lockedAt: accounts.lockedAt,
    })
    .from(accounts)
    .leftJoin(families, eq(families.id, accounts.familyId))
    .where(and(eq(accounts.id, accountId), isNull(accounts.deletedAt)));
  return row ? { ...row, lockedAt: row.lockedAt?.toISOString() ?? null } : null;
}
