import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { startTestDatabase } from './startTestDatabase.js';

// Dựng đúng schema trước 0040 để kiểm nâng cấp có dữ liệu, không chỉ DB rỗng.
export async function prepareLocalIdentityMigration() {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  const scratch = await mkdtemp(join(tmpdir(), 'angia-before-local-'));
  try {
    await owner.connect();
    await migrateLegacy(owner, scratch);
    const accountId = randomUUID();
    const familyId = randomUUID();
    const profileId = randomUUID();
    const sessionId = randomUUID();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà thử')", [familyId]);
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Hồ sơ thử')", [
      profileId,
      familyId,
    ]);
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role,health_profile_id)
       VALUES($1,'subject-cu','Người thử',$2,'main',$3)`,
      [accountId, familyId, profileId],
    );
    await owner.query(
      `INSERT INTO sessions(id,account_id,csrf_token,expires_at)
       VALUES($1,$2,'csrf-thu',now() + interval '1 day')`,
      [sessionId, accountId],
    );
    for (const lastSessionId of [sessionId, null]) {
      const id = randomUUID();
      await owner.query(
        `INSERT INTO push_subscriptions(id,family_id,account_id,last_session_id,authorized_at,endpoint,endpoint_hash,p256dh,auth)
         VALUES($1,$2,$3,$4,now(),$5,$5,'khoa-thu','auth-thu')`,
        [id, familyId, accountId, lastSessionId, id],
      );
    }
    const before: Record<string, Record<string, unknown>[]> = {};
    for (const table of ['families', 'health_profiles', 'accounts', 'sessions', 'push_subscriptions'])
      before[table] = (await owner.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
    return { db, owner, accountId, before };
  } catch (error) {
    await owner.end();
    await db.container.stop();
    throw error;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

async function migrateLegacy(owner: pg.Client, scratch: string) {
  const source = fileURLToPath(new URL('../../../drizzle', import.meta.url));
  const journal = JSON.parse(await readFile(join(source, 'meta/_journal.json'), 'utf8')) as {
    entries: { idx: number; tag: string }[];
  };
  journal.entries = journal.entries.filter((entry) => entry.idx < 40);
  await mkdir(join(scratch, 'meta'));
  await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(journal));
  for (const entry of journal.entries)
    await copyFile(join(source, `${entry.tag}.sql`), join(scratch, `${entry.tag}.sql`));
  await migrate(drizzle(owner), { migrationsFolder: scratch });
}
