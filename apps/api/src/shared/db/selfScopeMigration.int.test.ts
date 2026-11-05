import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { expect, it } from 'vitest';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from './runMigrations.js';

it('TC-577 (migration): thu hồi link đồng thuận đang chờ, giữ link đã phản hồi và trạng thái hồ sơ', async () => {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  const scratch = await mkdtemp(join(tmpdir(), 'angia-self-scope-migration-'));
  const migrations = fileURLToPath(new URL('../../../drizzle', import.meta.url));
  await owner.connect();
  try {
    const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8')) as {
      entries: { tag: string }[];
    };
    const index = journal.entries.findIndex((entry) => entry.tag.endsWith('_profile_links_self_scope'));
    expect(index).toBeGreaterThan(0);
    await mkdir(join(scratch, 'meta'));
    const legacy = { ...journal, entries: journal.entries.slice(0, index) };
    await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(legacy));
    for (const entry of legacy.entries)
      await copyFile(join(migrations, `${entry.tag}.sql`), join(scratch, `${entry.tag}.sql`));
    await migrate(drizzle(owner), { migrationsFolder: scratch });

    const familyId = randomUUID();
    const [invited, invitedOther, responded] = [randomUUID(), randomUUID(), randomUUID()];
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [familyId]);
    for (const [id, status] of [
      [invited, 'invited'],
      [invitedOther, 'invited'],
      [responded, 'declined'],
    ] as const)
      await owner.query(
        "INSERT INTO health_profiles(id,family_id,display_name,consent_status) VALUES($1,$2,'Mẹ',$3)",
        [id, familyId, status],
      );
    const insertInvitation = (profileId: string, response: string) =>
      owner.query(
        `INSERT INTO consent_invitations(id,family_id,profile_id,token_hash,expires_at,${response ? 'decision,respondent_name,basis,responded_at' : 'revoked_at'})
         VALUES($1,$2,$3,$4,now() + interval '1 day',${response || 'NULL'})`,
        [randomUUID(), familyId, profileId, randomUUID()],
      );
    await insertInvitation(invited, '');
    await insertInvitation(invitedOther, '');
    await insertInvitation(responded, "'declined','Mẹ','self',now()");

    await runMigrations(db.ownerUrl);

    const { rows } = await owner.query<{ profile_id: string; revoked: boolean; status: string }>(
      `SELECT i.profile_id, i.revoked_at IS NOT NULL AS revoked, p.consent_status AS status
       FROM consent_invitations i JOIN health_profiles p ON p.id = i.profile_id`,
    );
    expect(rows).toHaveLength(3);
    expect(rows).toEqual(
      expect.arrayContaining([
        { profile_id: invited, revoked: true, status: 'invited' },
        { profile_id: invitedOther, revoked: true, status: 'invited' },
        { profile_id: responded, revoked: false, status: 'declined' },
      ]),
    );
    await expect(runMigrations(db.ownerUrl)).resolves.toBe(0);
  } finally {
    await owner.end();
    await db.container.stop();
    await rm(scratch, { recursive: true, force: true });
  }
});
