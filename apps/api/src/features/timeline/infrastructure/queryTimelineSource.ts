import { sql, type SQL } from 'drizzle-orm';
import { timelineEventSchema, type TimelineEvent } from '@angia/contracts';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { TimelineSourceQuery } from '../application/ports.js';

export type TimelineScope = { tx: FamilyScopedTx; familyId: string; profileId: string };

// Mỗi nguồn xuất id/date/time/data, gom nhóm trước keyset và lấy dư một sự kiện.
export async function queryTimelineSource(
  { tx }: TimelineScope,
  { take, after }: TimelineSourceQuery,
  kind: TimelineEvent['kind'],
  source: SQL,
): Promise<TimelineEvent[]> {
  const condition = after
    ? sql`
    date < ${after.date}::date OR (date = ${after.date}::date AND (
      COALESCE(time, '') COLLATE "C" < ${after.time ?? ''} OR
      (COALESCE(time, '') = ${after.time ?? ''} AND (
        ${kind}::text COLLATE "C" > ${after.kind} OR
        (${kind}::text = ${after.kind} AND id COLLATE "C" > ${after.id})
      ))
    ))`
    : sql`true`;
  const result = await tx.execute(sql`
    SELECT id, date::text AS date, time, ${kind}::text AS kind, data FROM (${source}) events
    WHERE (${condition})
    ORDER BY date DESC, time COLLATE "C" DESC NULLS LAST, id COLLATE "C" ASC
    LIMIT ${take}
  `);
  return result.rows.map((row) => timelineEventSchema.parse(row));
}
