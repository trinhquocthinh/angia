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

it('TC-552: migration mở receipt mới, giữ nguyên hồ sơ/lời mời/audit cũ và chạy lại không đổi', async () => {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  const scratch = await mkdtemp(join(tmpdir(), 'angia-lg02-migration-'));
  const migrations = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
  await owner.connect();
  try {
    await mkdir(join(scratch, 'meta'));
    const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8')) as {
      entries: { tag: string }[];
    };
    const index = journal.entries.findIndex((e) => e.tag.endsWith('_consent_attestation'));
    expect(index).toBeGreaterThan(0);
    const pending = journal.entries.length - index;
    const legacy = { ...journal, entries: journal.entries.slice(0, index) };
    await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(legacy));
    for (const entry of legacy.entries)
      await copyFile(join(migrations, `${entry.tag}.sql`), join(scratch, `${entry.tag}.sql`));
    await migrate(drizzle(owner), { migrationsFolder: scratch });
    const familyId = randomUUID(),
      accountId = randomUUID();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [familyId]);
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role)
      VALUES($1,$2,'Main',$3,'main')`,
      [accountId, randomUUID(), familyId],
    );
    for (const status of ['pending', 'invited', 'declined', 'confirmed', 'withdrawn']) {
      const profileId = randomUUID();
      await owner.query(
        `INSERT INTO health_profiles(id,family_id,display_name,consent_status,consent_source,
        consent_confirmed_at,consent_basis,consent_respondent_name,consent_withdrawn_at)
        VALUES($1,$2,'Mẹ',$3,'invitation',now(),'self','Mẹ',CASE WHEN $3='withdrawn' THEN now() END)`,
        [profileId, familyId, status],
      );
      await owner.query(
        `INSERT INTO consent_invitations(id,family_id,profile_id,token_hash,expires_at)
        VALUES($1,$2,$3,$4,now()+interval '7 days')`,
        [randomUUID(), familyId, profileId, randomUUID()],
      );
    }
    const legacyId = randomUUID();
    await owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,consent_source)
      VALUES($1,$2,'Bà','legacy_attestation')`,
      [legacyId, familyId],
    );
    await owner.query(
      `INSERT INTO consent_legacy_attestations(profile_id,family_id,confirmed_at,confirmed_by_account_id,basis)
      VALUES($1,$2,now(),$3,'guardian')`,
      [legacyId, familyId, accountId],
    );
    const snapshot = async () => {
      const rows: unknown[][] = [];
      for (const table of ['health_profiles', 'consent_invitations', 'consent_legacy_attestations']) {
        // KH-3 thêm cột; ca LG-02 chỉ đối chiếu các trường đã tồn tại trước migration.
        const selection = table === 'health_profiles' ? "to_jsonb(t) - 'vitals_enabled' AS profile" : '*';
        rows.push((await owner.query(`SELECT ${selection} FROM ${table} t ORDER BY 1`)).rows);
      }
      return rows;
    };
    const before = await snapshot();
    expect(await runMigrations(db.ownerUrl)).toBe(pending);
    expect(await snapshot()).toEqual(before);
    expect(await runMigrations(db.ownerUrl)).toBe(0);
    await owner.query(
      `UPDATE health_profiles SET consent_status='confirmed',consent_source='main_attested',
      consent_confirmed_at=now(),consent_confirmed_by=$2,consent_basis='guardian',consent_respondent_name='Main' WHERE id=$1`,
      [legacyId, accountId],
    );
  } finally {
    await owner.end();
    await db.container.stop();
    await rm(scratch, { recursive: true, force: true });
  }
});
