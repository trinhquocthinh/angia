import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DocumentType } from '../domain/SourceDocument.js';

// Khóa cả khi chưa có bản ghi; không nâng khóa SHARE hồ sơ lên UPDATE gây deadlock.
export async function lockDuplicateRecord(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  type: DocumentType,
  date: string,
): Promise<void> {
  // PostgreSQL coi UUID hoa/thường là một; khóa phải dùng cùng biểu diễn.
  const key = `angia:duplicates:${familyId.toLowerCase()}:${profileId.toLowerCase()}:${type}:${date}`;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}
