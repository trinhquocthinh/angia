import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, writeFile, copyFile, readdir, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
const migrations = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
let db: TestDatabase;
let owner: pg.Client;
let folder: string;
beforeAll(async () => {
  db = await startTestDatabase();
  owner = new pg.Client({ connectionString: db.ownerUrl });
  await owner.connect();
  folder = await mkdtemp(join(tmpdir(), 'angia-before-0019-'));
  await mkdir(join(folder, 'meta'));
  const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8'));
  journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx < 19);
  await writeFile(join(folder, 'meta/_journal.json'), JSON.stringify(journal));
  for (const name of await readdir(migrations))
    if (name.endsWith('.sql') && name < '0019') await copyFile(join(migrations, name), join(folder, name));
  await migrate(drizzle(owner), { migrationsFolder: folder });
});
afterAll(async () => {
  await owner?.end();
  await db?.container.stop();
  if (folder) await rm(folder, { recursive: true });
});
it('TC-362: nâng0018 giữ đích hợp lệ, loại phiên cũ hết hạn, dọn phiên không xóa thiết bị', async () => {
  const [family, account, live, expired, retained, dropped] = Array.from({ length: 6 }, () => randomUUID());
  await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [family]);
  await owner.query(
    "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1::uuid,$1::text,'Thử',$2,'main')",
    [account, family],
  );
  await owner.query(
    "INSERT INTO sessions(id,account_id,csrf_token,expires_at) VALUES($1,$3,'csrf',now()+interval '1 day'),($2,$3,'csrf',now()-interval '1 day')",
    [live, expired, account],
  );
  for (const [id, session] of [
    [retained, live],
    [dropped, expired],
  ])
    await owner.query(
      `INSERT INTO push_subscriptions(id,family_id,account_id,session_id,endpoint,endpoint_hash,p256dh,auth)
    VALUES($1::uuid,$2,$3,$4,$5,$1::text,'key','auth')`,
      [id, family, account, session, `https://web.push.apple.com/${id}`],
    );
  await migrate(drizzle(owner), { migrationsFolder: migrations });
  const rows = (await owner.query('SELECT id,last_session_id,authorized_at FROM push_subscriptions')).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ id: retained, last_session_id: live });
  expect(rows[0].authorized_at).toEqual(
    (await owner.query('SELECT created_at FROM sessions WHERE id=$1', [live])).rows[0].created_at,
  );
  await owner.query('DELETE FROM sessions WHERE id=$1', [live]);
  expect((await owner.query('SELECT id,account_id,last_session_id FROM push_subscriptions')).rows).toEqual([
    { id: retained, account_id: account, last_session_id: null },
  ]);
  const app = new pg.Client({ connectionString: db.appUrl });
  await app.connect();
  try {
    expect((await app.query('SELECT * FROM push_subscriptions')).rows).toEqual([]);
  } finally {
    await app.end();
  }
});
