import { and, asc, eq } from 'drizzle-orm';
import { accounts, healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AdminProfileLink } from '../domain/ProfileLink.js';

// Ngoại lệ hẹp BR-003: chỉ cột tên, tuyệt đối không thêm cột đồng thuận/sức khỏe.
export async function listProfileLinks(tx: FamilyScopedTx, familyId: string): Promise<AdminProfileLink[]> {
  const rows = await tx
    .select({
      id: healthProfiles.id,
      displayName: healthProfiles.displayName,
      accountId: accounts.id,
      accountName: accounts.displayName,
    })
    .from(healthProfiles)
    .leftJoin(accounts, and(eq(accounts.healthProfileId, healthProfiles.id), eq(accounts.familyId, familyId)))
    .where(eq(healthProfiles.familyId, familyId))
    .orderBy(asc(healthProfiles.createdAt), asc(healthProfiles.id));
  return rows.map(({ id, displayName, accountId, accountName }) => ({
    id,
    displayName,
    linkedAccount: accountId && accountName ? { id: accountId, displayName: accountName } : null,
  }));
}
