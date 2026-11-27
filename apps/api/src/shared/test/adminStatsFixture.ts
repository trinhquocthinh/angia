import { randomUUID } from 'node:crypto';
import type { startRegistrationTestApp } from './startRegistrationTestApp.js';
import { seedAccount, seedSession } from './seedAuthFixtures.js';

type TestApp = Awaited<ReturnType<typeof startRegistrationTestApp>>;

export async function seedAdminStats(t: TestApp) {
  const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
  const { rows } = await t.owner.query<{ ws: string }>(
    `SELECT to_char(date_trunc('week',now() AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS ws`,
  );
  const weekStart = rows[0]!.ws;
  const familyIds: string[] = [];
  const accountIds: string[] = [];
  for (let index = 0; index < 3; index++) {
    const familyId = randomUUID();
    const profileId = randomUUID();
    familyIds.push(familyId);
    await t.owner.query(
      "INSERT INTO families(id,name,created_at) VALUES($1,'Nhà bí mật',now()-interval '35 days')",
      [familyId],
    );
    const accountId = await seedAccount(t.owner, { familyId, familyRole: 'main', displayName: 'Tên bí mật' });
    accountIds.push(accountId);
    await t.owner.query(
      "UPDATE accounts SET created_at=now()-interval '35 days',username_normalized=$2 WHERE id=$1",
      [accountId, `stats.${index}`],
    );
    await t.owner.query(
      "INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Hồ sơ bí mật')",
      [profileId, familyId],
    );
    for (let offset = index; offset < (index === 2 ? 2 : 4); offset++) {
      await t.owner.query(
        `INSERT INTO dose_confirmations(id,family_id,health_profile_id,date,slot,confirmed_by_name,confirmed_at)
        VALUES($1,$2,$3,$4::date - $5::integer * 7,'morning','Tên bí mật',now())`,
        [randomUUID(), familyId, profileId, weekStart, offset],
      );
    }
  }
  const deleted = await seedAccount(t.owner);
  await t.owner.query(
    "UPDATE accounts SET deleted_at=now(),oidc_subject=NULL,display_name='',created_at=now()-interval '35 days' WHERE id=$1",
    [deleted],
  );
  return {
    admin,
    normal: await seedSession(t.owner, accountIds[0]!),
    weekStart,
    familyIds,
    accountIds,
    deleted,
  };
}
