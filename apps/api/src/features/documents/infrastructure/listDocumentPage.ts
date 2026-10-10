import { and, asc, desc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { sourceDocuments } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DocumentFilter, DocumentPage } from '../application/reviewPorts.js';

const d = sourceDocuments;

// F09a: keyset (created_at, id) giảm dần, lấy dư 1 bản để biết còn trang sau.
// Cursor thuộc gia đình khác bị RLS ẩn → so sánh với NULL → trang rỗng, không lộ dữ liệu.
// Lọc theo lô (≤ 10 chứng từ) sắp theo ngày chứng từ, chưa rõ ngày ở cuối (US-006), trả cả lô.
export async function listDocumentPage(
  tx: FamilyScopedTx,
  familyId: string,
  { statuses, profileId, batchId, limit, cursor }: DocumentFilter,
): Promise<DocumentPage> {
  const conditions: SQL[] = [eq(d.familyId, familyId)];
  if (statuses?.length) conditions.push(inArray(d.status, statuses));
  if (profileId) conditions.push(eq(d.healthProfileId, profileId));
  const query = tx.select().from(d);
  if (batchId) {
    conditions.push(eq(d.batchId, batchId));
    const items = await query
      .where(and(...conditions))
      .orderBy(sql`${d.documentDate} ASC NULLS LAST`, asc(d.createdAt), asc(d.id));
    return { items, nextCursor: null };
  }
  if (cursor) {
    conditions.push(
      sql`(${d.createdAt}, ${d.id}) < (SELECT c.created_at, c.id FROM source_documents c WHERE c.id = ${cursor})`,
    );
  }
  const rows = await query
    .where(and(...conditions))
    .orderBy(desc(d.createdAt), desc(d.id))
    .limit(limit + 1);
  const items = rows.slice(0, limit);
  return { items, nextCursor: rows.length > limit ? items[items.length - 1]!.id : null };
}
