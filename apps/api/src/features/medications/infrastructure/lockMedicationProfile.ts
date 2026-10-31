import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Tuần tự hóa mọi lệnh lưu thuốc của một hồ sơ, kể cả khi chưa có dòng đợt để khóa.
// Không nâng khóa SHARE hồ sơ lên UPDATE (hai lệnh nhập trực tiếp sẽ có thể deadlock).
export async function lockMedicationProfile(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<void> {
  const key = `angia:medications:${familyId.toLowerCase()}:${profileId.toLowerCase()}`;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}
