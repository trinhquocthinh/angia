import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { createInvitationRepository } from './createInvitationRepository.js';
import { createInvitationTokenCodec } from './createInvitationTokenCodec.js';
import { createInvitation } from '../application/createInvitation.js';
import { respondToInvitation } from '../application/respondToInvitation.js';

const migrations = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

describe('Migration đồng thuận: giữ audit cũ và đóng gate cũ', () => {
  let database: TestDatabase;
  let owner: pg.Client;
  let pool: pg.Pool;
  let scratch: string;
  beforeAll(async () => {
    database = await startTestDatabase();
    owner = new pg.Client({ connectionString: database.ownerUrl });
    await owner.connect();
    pool = new pg.Pool({ connectionString: database.appUrl });
    scratch = await mkdtemp(join(tmpdir(), 'angia-pre-invitation-'));
    await mkdir(join(scratch, 'meta'));
    const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8'));
    journal.entries = journal.entries.slice(0, 3);
    await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(journal));
    for (const entry of journal.entries) {
      await writeFile(
        join(scratch, `${entry.tag}.sql`),
        await readFile(join(migrations, `${entry.tag}.sql`)),
      );
    }
    await migrate(drizzle(owner), { migrationsFolder: scratch });
  });
  afterAll(async () => {
    await pool?.end();
    await owner?.end();
    await database?.container.stop();
    if (scratch) await rm(scratch, { recursive: true, force: true });
  });
  it('metadata cũ được snapshot, pending; chấp nhận mới không sửa audit cũ', async () => {
    const familyId = randomUUID();
    const profileId = randomUUID();
    const accountId = randomUUID();
    const legacyAt = new Date('2026-10-05T00:00:00Z');
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [familyId]);
    await owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1,$2,'Main',$3,'main')",
      [accountId, randomUUID(), familyId],
    );
    await owner.query(
      "INSERT INTO health_profiles(id,family_id,display_name,consent_confirmed_at,consent_confirmed_by,consent_basis) VALUES($1,$2,'Mẹ',$3,$4,'guardian')",
      [profileId, familyId, legacyAt, accountId],
    );
    expect(await runMigrations(database.ownerUrl)).toBe(1);
    const profile = (await owner.query('SELECT * FROM health_profiles WHERE id=$1', [profileId])).rows[0];
    expect(profile).toMatchObject({
      consent_status: 'pending',
      consent_source: 'legacy_attestation',
      consent_confirmed_at: legacyAt,
      consent_confirmed_by: accountId,
      consent_basis: 'guardian',
    });
    const originalAudit = (
      await owner.query('SELECT * FROM consent_legacy_attestations WHERE profile_id=$1', [profileId])
    ).rows[0];
    expect(originalAudit).toEqual({
      profile_id: profileId,
      family_id: familyId,
      confirmed_at: legacyAt,
      confirmed_by_account_id: accountId,
      basis: 'guardian',
    });
    const deps = {
      repository: createInvitationRepository(createDatabase(pool)),
      codec: createInvitationTokenCodec('a'.repeat(48)),
      now: () => new Date(),
      newId: randomUUID,
    };
    const created = await createInvitation(deps, familyId, profileId, accountId);
    if (!created.ok) throw new Error('Không tạo được link fixture');
    expect(
      await respondToInvitation(deps, created.value.token, {
        decision: 'accepted',
        basis: 'self',
        respondentName: 'Mẹ',
      }),
    ).toMatchObject({ ok: true, value: { outcome: 'recorded' } });
    expect(
      (await owner.query('SELECT * FROM consent_legacy_attestations WHERE profile_id=$1', [profileId]))
        .rows[0],
    ).toEqual(originalAudit);
    expect((await pool.query('SELECT * FROM consent_legacy_attestations')).rowCount).toBe(0);
    expect(await runMigrations(database.ownerUrl)).toBe(0);
  });
});
