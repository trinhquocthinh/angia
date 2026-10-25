import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

// src/shared/db và dist/shared/db đều cách apps/api/drizzle đúng 3 cấp.
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../../drizzle', import.meta.url));

// Chỉ chạy bằng role owner (DATABASE_OWNER_URL); trả về số migration vừa áp dụng.
export async function runMigrations(ownerConnectionString: string): Promise<number> {
  const client = new pg.Client({ connectionString: ownerConnectionString });
  await client.connect();
  try {
    const before = await countApplied(client);
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
    return (await countApplied(client)) - before;
  } finally {
    await client.end();
  }
}

// Bảng nhật ký do drizzle tạo ở lần migrate đầu; DB rỗng thì chưa có.
async function countApplied(client: pg.Client): Promise<number> {
  const journal = await client.query<{ exists: boolean }>(
    `SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists`,
  );
  if (!journal.rows[0]?.exists) return 0;
  const { rows } = await client.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM drizzle.__drizzle_migrations`,
  );
  return rows[0]?.total ?? 0;
}
