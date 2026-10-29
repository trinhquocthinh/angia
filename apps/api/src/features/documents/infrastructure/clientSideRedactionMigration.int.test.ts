import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';

const migrations = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
const hash = 'a'.repeat(64);

describe('TC-400–403 migration che ảnh trên thiết bị', () => {
  let database: TestDatabase;
  let owner: pg.Client;
  let scratch: string;
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  const profileId = randomUUID();
  const accountId = randomUUID();
  const ids = {
    rejected: randomUUID(),
    unapproved: randomUUID(),
    approved: randomUUID(),
    manual: randomUUID(),
  };

  beforeAll(async () => {
    database = await startTestDatabase();
    owner = new pg.Client({ connectionString: database.ownerUrl });
    await owner.connect();
    scratch = await mkdtemp(join(tmpdir(), 'angia-pre-redaction-'));
    await mkdir(join(scratch, 'meta'));
    const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8'));
    const oldEntries = journal.entries.filter(
      (entry: { tag: string }) => entry.tag !== '0033_client_side_redaction',
    );
    journal.entries = oldEntries;
    await writeFile(join(scratch, 'meta/_journal.json'), JSON.stringify(journal));
    for (const entry of oldEntries) {
      await writeFile(
        join(scratch, `${entry.tag}.sql`),
        await readFile(join(migrations, `${entry.tag}.sql`)),
      );
    }
    await migrate(drizzle(owner), { migrationsFolder: scratch });
    await owner.query('INSERT INTO families(id,name) VALUES($1,$2),($3,$4)', [
      familyId,
      'Nhà',
      otherFamilyId,
      'Nhà khác',
    ]);
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role)
       VALUES($1,$2,'Main',$3,'main')`,
      [accountId, randomUUID(), familyId],
    );
    await owner.query(`INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Mẹ')`, [
      profileId,
      familyId,
    ]);
    const batchId = randomUUID();
    await owner.query(
      `INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES($1,$2,$3,$4)`,
      [batchId, familyId, profileId, accountId],
    );
    const rows: [string, string, boolean, boolean][] = [
      [ids.rejected, 'rejected', false, false],
      [ids.unapproved, 'awaiting_privacy', false, false],
      [ids.approved, 'approved', true, false],
      [ids.manual, 'manual_entry', false, true],
    ];
    for (const [id, status, approved, draft] of rows) {
      await owner.query(
        `INSERT INTO source_documents(
           id,family_id,health_profile_id,batch_id,status,document_date,
           original_key,preview_key,ocr_image_key,ocr_image_sha256,
           privacy_approved_by,privacy_approved_at,privacy_draft_id,privacy_draft_status,
           mime_type,size_bytes)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'image/jpeg',100)`,
        [
          id,
          familyId,
          profileId,
          batchId,
          status,
          status === 'approved' ? '2026-10-20' : null,
          `families/${familyId}/documents/${id}/original.jpg`,
          `families/${familyId}/documents/${id}/preview.webp`,
          approved || draft ? `families/${familyId}/documents/${id}/ocr.png` : null,
          approved || draft ? hash : null,
          approved ? accountId : null,
          approved ? new Date('2026-10-20T00:00:00Z') : null,
          draft ? randomUUID() : null,
          draft ? 'ready' : null,
        ],
      );
    }
    await owner.query(
      `INSERT INTO extractions(id,family_id,source_document_id,provider,model,payload,cost_usd)
       VALUES($1,$2,$3,'fake','fixture','{}',0)`,
      [randomUUID(), familyId, ids.rejected],
    );
  });

  afterAll(async () => {
    await owner?.end();
    await database?.container.stop();
    if (scratch) await rm(scratch, { recursive: true, force: true });
  });

  it('TC-400–403 giữ bản đã duyệt, xóa chứng từ chưa duyệt và ghi đủ khóa cần dọn', async () => {
    expect(await runMigrations(database.ownerUrl)).toBe(1);
    const { rows } = await owner.query<{
      id: string;
      status: string;
      image_key: string | null;
      image_sha256: string | null;
    }>('SELECT id,status,image_key,image_sha256 FROM source_documents ORDER BY id');
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          id: ids.approved,
          status: 'approved',
          image_key: `families/${familyId}/documents/${ids.approved}/ocr.png`,
          image_sha256: hash,
        },
        { id: ids.manual, status: 'manual_entry', image_key: null, image_sha256: null },
      ]),
    );
    expect(rows.map((row) => row.id).sort()).toEqual([ids.approved, ids.manual].sort());
    expect((await owner.query('SELECT count(*)::int AS total FROM extractions')).rows[0]?.total).toBe(0);
    const purges = await owner.query<{ object_key: string }>('SELECT object_key FROM object_purges');
    expect(purges.rows.map((row) => row.object_key).sort()).toEqual(
      [
        ...Object.values(ids).flatMap((id) => [
          `families/${familyId}/documents/${id}/original.jpg`,
          `families/${familyId}/documents/${id}/preview.webp`,
        ]),
        `families/${familyId}/documents/${ids.manual}/ocr.png`,
      ].sort(),
    );
    const columns = await owner.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name='source_documents'`,
    );
    expect(columns.rows.map((row) => row.column_name)).not.toContain('original_key');
    await expect(
      owner.query(
        `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,
       mime_type,size_bytes) SELECT $1,$2,$3,id,'awaiting_privacy','image/jpeg',100
       FROM upload_batches LIMIT 1`,
        [randomUUID(), familyId, profileId],
      ),
    ).rejects.toThrow();
  });

  it('TC-403 cho upload khóa tạm, chặn thay ảnh đã làm sạch và cho phép P2 xóa ảnh', async () => {
    const uploadId = randomUUID();
    const batchId = (await owner.query<{ id: string }>('SELECT id FROM upload_batches LIMIT 1')).rows[0]!.id;
    await owner.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,
       image_key,privacy_approved_by,privacy_approved_at,mime_type,size_bytes)
       VALUES($1,$2,$3,$4,'uploaded',$5,$6,now(),'image/jpeg',100)`,
      [
        uploadId,
        familyId,
        profileId,
        batchId,
        `families/${familyId}/documents/${uploadId}/upload.jpg`,
        accountId,
      ],
    );
    await owner.query(
      `UPDATE source_documents SET image_key=$2,image_sha256=$3,status='extracting' WHERE id=$1`,
      [uploadId, `families/${familyId}/documents/${uploadId}/images/${randomUUID()}.jpg`, hash],
    );
    await expect(
      owner.query('UPDATE source_documents SET privacy_approved_by=NULL WHERE id=$1', [uploadId]),
    ).rejects.toThrow();
    await expect(
      owner.query('UPDATE source_documents SET image_sha256=$2 WHERE id=$1', [uploadId, 'b'.repeat(64)]),
    ).rejects.toThrow();
    await owner.query('UPDATE source_documents SET image_key=NULL,image_sha256=NULL,status=$2 WHERE id=$1', [
      uploadId,
      'manual_entry',
    ]);
    const row = (
      await owner.query(
        'SELECT image_key,image_sha256,privacy_approved_by FROM source_documents WHERE id=$1',
        [uploadId],
      )
    ).rows[0];
    expect(row).toEqual({ image_key: null, image_sha256: null, privacy_approved_by: accountId });
    await expect(
      owner.query(`UPDATE source_documents SET image_key=$2,image_sha256=$3 WHERE id=$1`, [
        uploadId,
        `families/${familyId}/documents/${uploadId}/replacement.jpg`,
        hash,
      ]),
    ).rejects.toThrow();
  });

  it('TC-403 role app NOBYPASSRLS chỉ nhìn thấy object cần dọn của gia đình phiên', async () => {
    const app = new pg.Client({ connectionString: database.appUrl });
    await app.connect();
    try {
      await app.query('BEGIN');
      await app.query("SELECT set_config('app.family_id',$1,true)", [otherFamilyId]);
      expect((await app.query('SELECT object_key FROM object_purges')).rows).toEqual([]);
      await app.query('ROLLBACK');
    } finally {
      await app.end();
    }
  });
});
