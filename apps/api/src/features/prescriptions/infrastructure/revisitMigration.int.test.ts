import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { expect, it } from 'vitest';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';

it('TC-478: nâng cấp giữ nguyên đơn/ledger nhắc thuốc cũ, ngày hẹn null và chạy lại an toàn', async () => {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  const scratch = await mkdtemp(join(tmpdir(), 'angia-revisit-migration-'));
  const migrations = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
  await owner.connect();
  try {
    const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8')) as {
      entries: { tag: string }[];
    };
    const index = journal.entries.findIndex((entry) => entry.tag.endsWith('_revisit_reminders'));
    expect(index).toBeGreaterThan(0);
    await mkdir(join(scratch, 'meta'));
    const legacy = { ...journal, entries: journal.entries.slice(0, index) };
    await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(legacy));
    for (const entry of legacy.entries)
      await copyFile(join(migrations, `${entry.tag}.sql`), join(scratch, `${entry.tag}.sql`));
    await migrate(drizzle(owner), { migrationsFolder: scratch });
    const familyId = randomUUID();
    const profileId = randomUUID();
    const reminderId = randomUUID();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [familyId]);
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Mẹ')", [
      profileId,
      familyId,
    ]);
    await owner.query(
      "INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,manual_without_source) VALUES($1,$2,$3,'2026-10-01',true)",
      [randomUUID(), familyId, profileId],
    );
    await owner.query(
      "INSERT INTO reminders(id,family_id,health_profile_id,date,slot,scheduled_at,medications) VALUES($1,$2,$3,'2026-10-01','morning',now(),'[{}]')",
      [reminderId, familyId, profileId],
    );
    await owner.query(
      "INSERT INTO reminder_deliveries(id,family_id,reminder_id,status) VALUES($1,$2,$3,'pending')",
      [randomUUID(), familyId, reminderId],
    );
    const prescriptions = (await owner.query('SELECT * FROM prescriptions')).rows;
    const ledger = (await owner.query('SELECT * FROM reminder_deliveries')).rows;
    expect(await runMigrations(db.ownerUrl)).toBe(journal.entries.length - index);
    expect((await owner.query('SELECT * FROM prescriptions')).rows).toEqual(
      prescriptions.map((row) => ({ ...row, revisit_date: null })),
    );
    expect((await owner.query('SELECT * FROM reminder_deliveries')).rows).toEqual(
      ledger.map((row) => ({ ...row, revisit_reminder_id: null })),
    );
    expect(await runMigrations(db.ownerUrl)).toBe(0);
  } finally {
    await owner.end();
    await db.container.stop();
    await rm(scratch, { recursive: true, force: true });
  }
});
