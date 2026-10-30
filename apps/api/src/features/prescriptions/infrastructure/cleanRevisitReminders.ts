import { and, eq, isNull, notExists } from 'drizzle-orm';
import { prescriptions, revisitReminders } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Bên gọi giữ khóa advisory hồ sơ trước khi đổi/xóa đơn; ledger chưa gửi theo FK CASCADE.
export async function cleanRevisitReminders(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  date: string,
): Promise<void> {
  await tx.delete(revisitReminders).where(
    and(
      eq(revisitReminders.familyId, familyId),
      eq(revisitReminders.healthProfileId, profileId),
      eq(revisitReminders.revisitDate, date),
      isNull(revisitReminders.sentAt),
      notExists(
        tx
          .select({ id: prescriptions.id })
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.familyId, familyId),
              eq(prescriptions.healthProfileId, profileId),
              eq(prescriptions.revisitDate, date),
            ),
          ),
      ),
    ),
  );
}
