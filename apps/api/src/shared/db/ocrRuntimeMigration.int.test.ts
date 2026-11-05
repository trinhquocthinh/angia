import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { expect, it } from 'vitest';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';

it('TC-630: migration trả reservation cũ nhưng giữ nguyên phí đã quyết toán, cap và không tự cấp lượt', async () => {
  const db = await startTestDatabase();
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  await owner.connect();
  const legacy = await mkdtemp(join(tmpdir(), 'angia-cp54-migration-'));
  const source = fileURLToPath(new URL('../../../drizzle', import.meta.url));
  try {
    await mkdir(join(legacy, 'meta'));
    for (const name of await readdir(source))
      if (name.endsWith('.sql') && name < '0029') await copyFile(join(source, name), join(legacy, name));
    const journal = JSON.parse(await readFile(join(source, 'meta/_journal.json'), 'utf8')) as {
      entries: { idx: number }[];
    };
    journal.entries = journal.entries.filter((entry) => entry.idx < 29);
    await writeFile(join(legacy, 'meta/_journal.json'), JSON.stringify(journal));
    await migrate(drizzle(owner), { migrationsFolder: legacy });
    const familyId = randomUUID(),
      profileId = randomUUID(),
      batchId = randomUUID(),
      documentId = randomUUID(),
      accountId = randomUUID();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà thử')", [familyId]);
    await owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1::uuid,$1::text,'Main',$2,'main')",
      [accountId, familyId],
    );
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Hồ sơ')", [
      profileId,
      familyId,
    ]);
    await owner.query(
      'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES($1,$2,$3,$4)',
      [batchId, familyId, profileId, accountId],
    );
    await owner.query(
      "INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,original_key,mime_type,size_bytes) VALUES($1,$2,$3,$4,'extracting','synthetic','image/png',1)",
      [documentId, familyId, profileId, batchId],
    );
    await owner.query("INSERT INTO extraction_spend(month,cap_usd,spent_usd) VALUES('2026-10',20,1.02)");
    await owner.query(
      "INSERT INTO family_extraction_spend(family_id,month,spent_usd) VALUES($1,'2026-10',0.32)",
      [familyId],
    );
    await owner.query(
      "INSERT INTO extraction_reservations(source_document_id,family_id,month,amount_usd) VALUES($1,$2,'2026-10',0.02)",
      [documentId, familyId],
    );
    await migrate(drizzle(owner), { migrationsFolder: source });
    expect((await owner.query('SELECT cap_usd::text,spent_usd::text FROM extraction_spend')).rows[0]).toEqual(
      { cap_usd: '20.00', spent_usd: '1.000000' },
    );
    expect((await owner.query('SELECT spent_usd::text FROM family_extraction_spend')).rows[0]).toEqual({
      spent_usd: '0.300000',
    });
    expect((await owner.query('SELECT * FROM extraction_reservations')).rowCount).toBe(0);
    expect((await owner.query('SELECT * FROM family_scan_quotas')).rowCount).toBe(0);
  } finally {
    await owner.end();
    await db.container.stop();
    await rm(legacy, { recursive: true, force: true });
  }
});
