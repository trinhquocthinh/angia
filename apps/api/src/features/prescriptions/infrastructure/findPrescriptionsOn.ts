import { and, asc, eq, inArray } from 'drizzle-orm';
import { prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Prescription } from '../domain/Prescription.js';
import { toPrescription } from './prescriptionRows.js';

// Đơn đã lưu của hồ sơ trong một ngày kê (chỉ mục prescriptions_profile_issued_idx), kèm dòng thuốc.
export async function findPrescriptionsOn(
  tx: FamilyScopedTx,
  familyId: string,
  healthProfileId: string,
  issuedDate: string,
): Promise<Prescription[]> {
  const rows = await tx
    .select()
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.familyId, familyId),
        eq(prescriptions.healthProfileId, healthProfileId),
        eq(prescriptions.issuedDate, issuedDate),
      ),
    )
    .orderBy(asc(prescriptions.createdAt), asc(prescriptions.id));
  if (rows.length === 0) return [];
  const itemRows = await tx
    .select()
    .from(prescriptionItems)
    .where(
      and(
        eq(prescriptionItems.familyId, familyId),
        inArray(
          prescriptionItems.prescriptionId,
          rows.map((row) => row.id),
        ),
      ),
    );
  return rows.map((row) =>
    toPrescription(
      row,
      itemRows.filter((item) => item.prescriptionId === row.id),
    ),
  );
}
