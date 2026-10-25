import { and, asc, eq, isNotNull } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { accounts } from '@src/shared/db/schema/index.js';
import type { FamilyAccount } from '../domain/ReminderRecipient.js';

// Tài khoản đang thuộc gia đình theo thứ tự tạo; bảng accounts không RLS nên luôn lọc family_id tường minh.
export async function listFamilyAccounts(tx: FamilyScopedTx, familyId: string): Promise<FamilyAccount[]> {
  const rows = await tx
    .select({
      id: accounts.id,
      displayName: accounts.displayName,
      role: accounts.familyRole,
      healthProfileId: accounts.healthProfileId,
    })
    .from(accounts)
    .where(and(eq(accounts.familyId, familyId), isNotNull(accounts.familyRole)))
    .orderBy(asc(accounts.createdAt), asc(accounts.id));
  return rows.map((a) => ({ ...a, role: a.role! }));
}
