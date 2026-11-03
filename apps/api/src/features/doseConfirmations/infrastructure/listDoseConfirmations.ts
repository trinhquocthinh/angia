import { and, eq, sql } from 'drizzle-orm';
import { doseConfirmations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { StoredDoseConfirmation } from '../application/ports.js';

// Xác nhận của một ngày; RLS giới hạn theo gia đình và phạm vi tự xem.
export async function listDoseConfirmations(
  tx: FamilyScopedTx,
  profileId: string,
  date: string,
): Promise<StoredDoseConfirmation[]> {
  const rows = await tx
    .select({
      profileId: doseConfirmations.healthProfileId,
      date: sql<string>`${doseConfirmations.date}::text`,
      slot: doseConfirmations.slot,
      accountId: doseConfirmations.confirmedByAccountId,
      displayName: doseConfirmations.confirmedByName,
      confirmedAt: doseConfirmations.confirmedAt,
    })
    .from(doseConfirmations)
    .where(and(eq(doseConfirmations.healthProfileId, profileId), eq(doseConfirmations.date, date)));
  return rows.map(({ accountId, displayName, confirmedAt, ...row }) => ({
    ...row,
    confirmedBy: { accountId, displayName },
    confirmedAt: confirmedAt.toISOString(),
  }));
}
