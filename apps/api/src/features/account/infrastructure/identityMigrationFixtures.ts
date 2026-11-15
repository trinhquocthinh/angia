import { randomUUID } from 'node:crypto';
import type pg from 'pg';

// Dữ liệu hoàn toàn giả, chỉ dùng trong Testcontainers.
export async function seedIdentityMigrationFixtures(client: pg.ClientBase) {
  const families = [randomUUID(), randomUUID()];
  const ids = Array.from({ length: 5 }, () => randomUUID());
  const profiles = [randomUUID(), randomUUID()];
  await client.query(`INSERT INTO families (id, name) VALUES ($1, 'Nhà Thử A'), ($2, 'Nhà Thử B')`, families);
  await client.query(
    `INSERT INTO health_profiles (id, family_id, display_name)
    VALUES ($1, $3, 'Người Thử A'), ($2, $3, 'Hồ Sơ Thử Không Account')`,
    [...profiles, families[0]],
  );
  for (let i = 0; i < ids.length; i++) {
    await client.query(
      `INSERT INTO accounts
      (id, oidc_subject, family_id, family_role, is_system_admin, display_name, health_profile_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        ids[i],
        i === 4 ? null : `oidc-thu-${i}`,
        i < 3 ? families[i === 2 ? 1 : 0] : null,
        i < 3 ? (i === 1 ? 'member' : 'main') : null,
        i === 3,
        `Người Thử ${i}`,
        i === 0 ? profiles[0] : null,
      ],
    );
  }
  return { ids, families, profiles };
}
