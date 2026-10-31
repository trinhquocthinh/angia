import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PrescriptionPosition } from '../application/prescriptionChainPorts.js';

// Lọc hồ sơ/gia đình trước window, lọc ID sau window để giữ được hai đơn liền kề.
export async function findPrescriptionPosition(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  prescriptionId: string,
): Promise<PrescriptionPosition | null> {
  const result = await tx.execute<{ previousId: string | null; nextId: string | null }>(sql`
    SELECT "previousId", "nextId" FROM (
      SELECT id,
        lag(id) OVER chain AS "previousId", lead(id) OVER chain AS "nextId"
      FROM prescriptions WHERE family_id=${familyId} AND health_profile_id=${profileId}
      WINDOW chain AS (ORDER BY issued_date, created_at, id)
    ) ordered WHERE id=${prescriptionId}
  `);
  return result.rows[0] ?? null;
}
