import { and, eq } from 'drizzle-orm';
import { prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Prescription } from '../domain/Prescription.js';
import { toPrescription } from './prescriptionRows.js';

// Đơn của đúng hồ sơ trong gia đình của phiên (RLS + điều kiện phòng thủ), kèm dòng thuốc.
export async function findProfilePrescription(
  tx: FamilyScopedTx,
  familyId: string,
  healthProfileId: string,
  prescriptionId: string,
): Promise<Prescription | null> {
  const [row] = await tx
    .select()
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.id, prescriptionId),
        eq(prescriptions.familyId, familyId),
        eq(prescriptions.healthProfileId, healthProfileId),
      ),
    );
  if (!row) return null;
  const items = await tx
    .select()
    .from(prescriptionItems)
    .where(and(eq(prescriptionItems.familyId, familyId), eq(prescriptionItems.prescriptionId, row.id)));
  return toPrescription(row, items);
}
