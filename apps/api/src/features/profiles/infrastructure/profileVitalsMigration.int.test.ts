import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { expect, it } from 'vitest';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';

it('TC-442: migration giữ hồ sơ cũ, không backfill năm sinh hoặc công tắc và chạy lại an toàn', async () => {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  const scratch = await mkdtemp(join(tmpdir(), 'angia-vitals-migration-'));
  const migrations = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
  await owner.connect();
  try {
    await mkdir(join(scratch, 'meta'));
    const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8')) as {
      entries: { tag: string }[];
    };
    const index = journal.entries.findIndex((entry) => entry.tag.endsWith('_profile_vitals_enabled'));
    expect(index).toBeGreaterThan(0);
    const legacy = { ...journal, entries: journal.entries.slice(0, index) };
    await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(legacy));
    for (const entry of legacy.entries)
      await copyFile(join(migrations, `${entry.tag}.sql`), join(scratch, `${entry.tag}.sql`));
    await migrate(drizzle(owner), { migrationsFolder: scratch });
    const familyId = randomUUID();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [familyId]);
    for (const birthYear of [null, 2020, 1950]) {
      await owner.query(
        "INSERT INTO health_profiles(id,family_id,display_name,birth_year) VALUES($1,$2,'Mẹ',$3)",
        [randomUUID(), familyId, birthYear],
      );
    }
    const before = (await owner.query('SELECT * FROM health_profiles ORDER BY id')).rows;
    expect(await runMigrations(db.ownerUrl)).toBe(journal.entries.length - index);
    expect((await owner.query('SELECT * FROM health_profiles ORDER BY id')).rows).toEqual(
      before.map((profile) => ({ ...profile, vitals_enabled: null })),
    );
    expect(await runMigrations(db.ownerUrl)).toBe(0);
  } finally {
    await owner.end();
    await db.container.stop();
    await rm(scratch, { recursive: true, force: true });
  }
});
