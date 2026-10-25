import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { measurements } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { MeasurementKind } from '../domain/Measurement.js';
import type { MeasurementPage, MeasurementPageRequest } from '../application/ports.js';
import { toDbKind, toMeasurement } from './measurementRows.js';

const m = measurements;
// Khóa sắp xếp giảm dần; `measured_time IS NOT NULL` đặt số đo chưa có giờ ở cuối ngày (NULLS LAST)
// mà vẫn so sánh được theo bộ giá trị cho keyset.
const sortColumns = (alias: string) =>
  sql.raw(
    `${alias}.measured_on, ${alias}.measured_time IS NOT NULL, COALESCE(${alias}.measured_time, ''), ${alias}.created_at, ${alias}.id`,
  );

// F09a: keyset giảm dần, lấy dư 1 bản để biết còn trang sau. Cursor thuộc gia đình khác bị RLS ẩn
// → so sánh với NULL → trang rỗng, không lộ dữ liệu.
export async function listMeasurementPage(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  kind: MeasurementKind | undefined,
  { limit, cursor }: MeasurementPageRequest,
): Promise<MeasurementPage> {
  const conditions: SQL[] = [eq(m.healthProfileId, profileId), eq(m.familyId, familyId)];
  if (kind) conditions.push(eq(m.kind, toDbKind(kind)));
  if (cursor) {
    conditions.push(
      sql`(${sortColumns('measurements')}) < (SELECT ${sortColumns('c')} FROM measurements c WHERE c.id = ${cursor})`,
    );
  }
  const rows = await tx
    .select()
    .from(m)
    .where(and(...conditions))
    .orderBy(desc(m.measuredOn), sql`${m.measuredTime} DESC NULLS LAST`, desc(m.createdAt), desc(m.id))
    .limit(limit + 1);
  const items = rows.slice(0, limit).map(toMeasurement);
  return { items, nextCursor: rows.length > limit ? items[items.length - 1]!.id : null };
}
