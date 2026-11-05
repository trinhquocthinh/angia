import { and, eq, inArray, sql } from 'drizzle-orm';
import { prescriptions, prescriptionItems } from '@src/shared/db/schema/index.js';
import { toPrescription } from '@src/features/prescriptions/infrastructure/prescriptionRows.js';
import type { TimelinePrescriptionPair } from '../application/ports.js';
import type { TimelineScope } from './queryTimelineSource.js';
import { approvedTimelineRecord } from './approvedTimelineRecord.js';

// Lọc nguồn trước lag, chọn trang sau lag: đơn liền trước có thể nằm ngoài trang.
export async function loadTimelinePrescriptionPairs(
  scope: TimelineScope,
  ids: string[],
): Promise<TimelinePrescriptionPair[]> {
  if (!ids.length) return [];
  const { tx, familyId, profileId } = scope;
  const positions = await tx.execute<{ id: string; previous_id: string | null }>(sql`
    SELECT id, previous_id FROM (
      SELECT p.id, lag(p.id) OVER (ORDER BY p.issued_date,p.created_at,p.id) AS previous_id
      FROM prescriptions p WHERE p.family_id=${familyId} AND p.health_profile_id=${profileId}
        AND (${approvedTimelineRecord(scope, 'p')})
    ) chain WHERE id IN (${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`,`,
    )})
  `);
  const allIds = [
    ...new Set(positions.rows.flatMap((row) => (row.previous_id ? [row.id, row.previous_id] : [row.id]))),
  ];
  if (!allIds.length) return [];
  const rows = await tx
    .select()
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.familyId, familyId),
        eq(prescriptions.healthProfileId, profileId),
        inArray(prescriptions.id, allIds),
      ),
    );
  const items = await tx
    .select()
    .from(prescriptionItems)
    .where(and(eq(prescriptionItems.familyId, familyId), inArray(prescriptionItems.prescriptionId, allIds)));
  const records = new Map(
    rows.map((row) => [
      row.id,
      toPrescription(
        row,
        items.filter((item) => item.prescriptionId === row.id),
      ),
    ]),
  );
  return positions.rows.map((row) => ({
    current: records.get(row.id)!,
    previous: row.previous_id ? records.get(row.previous_id)! : null,
  }));
}
