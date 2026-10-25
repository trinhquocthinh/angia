import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Tuần tự hóa lệnh ghi giai đoạn của một hồ sơ, kể cả khi thuốc chưa có dòng nào để khóa.
export async function lockAdherenceProfile(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<void> {
  const key = `angia:adherence:${familyId}:${profileId}`;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}
