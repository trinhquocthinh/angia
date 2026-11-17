import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { runMigrations } from '../db/runMigrations.js';
import { startTestDatabase } from './startTestDatabase.js';

// Chỉ PostgreSQL Testcontainers, không kết nối DB ứng dụng.
export async function startHouseholdDatabase() {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  const app = new pg.Client({ connectionString: db.appUrl });
  try {
    await runMigrations(db.ownerUrl);
    await owner.connect();
    await app.connect();
    return {
      db,
      owner,
      app,
      async seed() {
        const family = randomUUID();
        const profile = randomUUID();
        const accounts = [randomUUID(), randomUUID(), randomUUID()];
        await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà thử')", [family]);
        for (const id of accounts) {
          await owner.query(
            "INSERT INTO accounts(id,display_name,family_id,family_role) VALUES($1,'Người thử',$2,'main')",
            [id, family],
          );
        }
        await owner.query(
          `INSERT INTO health_profiles(id,family_id,display_name,birth_year)
           VALUES($1,$2,'Bé',extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int-10)`,
          [profile, family],
        );
        return { family, profile, accounts };
      },
      async stop() {
        await app.end();
        await owner.end();
        await db.container.stop();
      },
    };
  } catch (error) {
    await app.end();
    await owner.end();
    await db.container.stop();
    throw error;
  }
}
