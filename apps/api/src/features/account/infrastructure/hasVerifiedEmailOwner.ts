import { and, isNotNull, ne, sql } from 'drizzle-orm';
import { accounts } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function hasVerifiedEmailOwner(
  tx: FamilyScopedTx,
  accountId: string,
  email: string,
): Promise<boolean> {
  const [owner] = await tx
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(
        ne(accounts.id, accountId),
        isNotNull(accounts.emailVerifiedAt),
        sql`lower(${accounts.email}) = lower(${email})`,
      ),
    )
    .limit(1);
  return owner !== undefined;
}
