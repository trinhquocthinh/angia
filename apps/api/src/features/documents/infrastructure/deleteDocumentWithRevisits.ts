import { and, eq } from 'drizzle-orm';
import { lockMedicationProfile } from '@src/features/medications/infrastructure/lockMedicationProfile.js';
import { cleanRevisitReminders } from '@src/features/prescriptions/infrastructure/cleanRevisitReminders.js';
import { prescriptions, sourceDocuments } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Bên gọi đã khóa chứng từ rồi SHARE hồ sơ; lấy advisory trước khi đọc ngày cũ và cascade đơn.
export async function deleteDocumentWithRevisits(
  tx: FamilyScopedTx,
  familyId: string,
  id: string,
): Promise<void> {
  const owned = and(eq(sourceDocuments.id, id), eq(sourceDocuments.familyId, familyId));
  const [document] = await tx
    .select({ profileId: sourceDocuments.healthProfileId })
    .from(sourceDocuments)
    .where(owned);
  if (!document) return;
  await lockMedicationProfile(tx, familyId, document.profileId);
  const dates = await tx
    .selectDistinct({ date: prescriptions.revisitDate })
    .from(prescriptions)
    .where(and(eq(prescriptions.sourceDocumentId, id), eq(prescriptions.familyId, familyId)));
  await tx.delete(sourceDocuments).where(owned);
  for (const { date } of dates) {
    if (date) await cleanRevisitReminders(tx, familyId, document.profileId, date);
  }
}
