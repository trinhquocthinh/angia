import { sql } from 'drizzle-orm';
import type { Database } from './createDatabase.js';
import { type FamilyScopedTx, UUID_PATTERN, withFamilyScope } from './withFamilyScope.js';

// Bọc mọi truy vấn của route tự xem (SPEC-042, Tech Spec §3.9.3). profileId lấy từ accounts.health_profile_id
// của phiên, không bao giờ từ request. Giá trị rỗng sẽ bị policy hiểu là không ở phạm vi tự xem nên phải chặn tại đây.
export async function withSelfScope<T>(
  db: Pick<Database, 'transaction'>,
  scope: { familyId: string; profileId: string },
  work: (tx: FamilyScopedTx) => Promise<T>,
): Promise<T> {
  if (!UUID_PATTERN.test(scope.profileId)) {
    throw new Error('withSelfScope: profileId phải là UUID lấy từ tài khoản của phiên');
  }
  return withFamilyScope(db, scope.familyId, async (tx) => {
    await tx.execute(sql`SELECT set_config('app.self_profile_id', ${scope.profileId}, true)`);
    return work(tx);
  });
}
