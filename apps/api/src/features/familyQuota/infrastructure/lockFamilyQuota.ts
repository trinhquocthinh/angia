import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// F03b (SPEC-030): tuần tự hóa các lệnh ghi có quota của cùng gia đình, không chặn gia đình khác và không cần
// quyền UPDATE trên families. Khóa nhả khi transaction kết thúc.
export async function lockFamilyQuota(tx: FamilyScopedTx, familyId: string): Promise<void> {
  const key = `angia:quota:${familyId}`;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}
