import { and, eq, sql } from 'drizzle-orm';
import type { PrescriptionListItem } from '@angia/contracts';
import { prescriptions, prescriptionItems } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Đếm theo lô, không nạp dòng thuốc của toàn bộ lịch sử vào bộ nhớ.
export async function listProfilePrescriptions(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<PrescriptionListItem[]> {
  return tx
    .select({
      id: prescriptions.id,
      issuedDate: prescriptions.issuedDate,
      facility: prescriptions.facility,
      diagnosis: prescriptions.diagnosis,
      revisitDate: prescriptions.revisitDate,
      itemCount: sql<number>`count(${prescriptionItems.id})`.mapWith(Number),
      origin: sql<
        'document' | 'manual'
      >`CASE WHEN ${prescriptions.sourceDocumentId} IS NULL THEN 'manual' ELSE 'document' END`,
    })
    .from(prescriptions)
    .leftJoin(
      prescriptionItems,
      and(eq(prescriptionItems.prescriptionId, prescriptions.id), eq(prescriptionItems.familyId, familyId)),
    )
    .where(and(eq(prescriptions.familyId, familyId), eq(prescriptions.healthProfileId, profileId)))
    .groupBy(prescriptions.id)
    .orderBy(prescriptions.issuedDate, prescriptions.createdAt, prescriptions.id);
}
