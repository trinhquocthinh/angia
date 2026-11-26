import { and, inArray, isNull, sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { accounts } from '../../apps/api/src/shared/db/schema/index.js';

export async function readReminderSeedActors(tx: FamilyScopedTx, usernames: string[]) {
  const role = await tx.execute(
    sql`SELECT current_database() AS db, rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
  );
  const row = role.rows[0];
  if (row?.db !== 'angia_dev' || row.rolname !== 'angia_dev_app' || row.rolsuper || row.rolbypassrls)
    throw new Error('Seed yêu cầu role dev app có RLS.');
  const actors = await tx
    .select({
      id: accounts.id,
      familyId: accounts.familyId,
      username: accounts.usernameNormalized,
      role: accounts.familyRole,
      profileId: accounts.healthProfileId,
    })
    .from(accounts)
    .where(and(inArray(accounts.usernameNormalized, usernames), isNull(accounts.deletedAt)))
    .for('update');
  if (actors.length !== usernames.length || actors.some((actor) => !actor.familyId))
    throw new Error('Mỗi tài khoản phải tồn tại và đã có gia đình.');
  return actors;
}
