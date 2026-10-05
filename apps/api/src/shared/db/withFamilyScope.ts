import { sql } from 'drizzle-orm';
import type { Database } from './createDatabase.js';

export type FamilyScopedTx = Parameters<Parameters<Database['transaction']>[0]>[0];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bọc mọi truy vấn dữ liệu sức khỏe (SPEC-006, Tech Spec §3): gán app.family_id cục bộ trong
// transaction để RLS lọc theo nhóm. set_config(..., true) tương đương SET LOCAL nhưng nhận tham số.
export async function withFamilyScope<T>(
  db: Database,
  familyId: string,
  work: (tx: FamilyScopedTx) => Promise<T>,
): Promise<T> {
  if (!UUID_PATTERN.test(familyId)) {
    throw new Error('withFamilyScope: familyId phải là UUID lấy từ phiên đăng nhập');
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.family_id', ${familyId}, true)`);
    return work(tx);
  });
}
