import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { EXTRACT_DOCUMENT_QUEUE } from '@angia/contracts';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ExtractionDependencies } from '@src/features/extraction/application/ports.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';
import { createFakeExtractor } from '@src/features/extraction/infrastructure/createFakeExtractor.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';
import { registerExtractDocumentJob } from './registerExtractDocumentJob.js';

// Migration SQL thuộc apps/api (role owner chạy ở container angia-migrate); test chỉ đọc thư mục.
const MIGRATIONS = fileURLToPath(new URL('../../../api/drizzle', import.meta.url));
const OWNER = 'angia_wtest';
const APP = 'angia_wtest_app';
const logger = pino({ level: 'silent' });

describe('Worker extract-document trên PostgreSQL thật (E2-S5-T2, Nợ #11)', () => {
  let container: StartedPostgreSqlContainer;
  let owner: pg.Client;
  let pool: pg.Pool;
  let boss: PgBoss;
  const deps = (): ExtractionDependencies => ({
    repository: createExtractionRepository(pool),
    storage: { get: async () => new Uint8Array([0xff, 0xd8, 0xff]) },
    images: { heicToJpeg: async (bytes) => bytes },
    extractor: createFakeExtractor(),
  });

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('angia_wtest')
      .withUsername(OWNER)
      .withPassword(OWNER)
      .start();
    owner = new pg.Client({ connectionString: container.getConnectionUri() });
    await owner.connect();
    await owner.query(`
      CREATE ROLE ${APP} LOGIN PASSWORD '${APP}' NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO ${APP};
      ALTER DEFAULT PRIVILEGES FOR ROLE ${OWNER} IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP};`);
    await migrate(drizzle(owner), { migrationsFolder: MIGRATIONS });
    const appUrl = new URL(container.getConnectionUri());
    appUrl.username = APP;
    appUrl.password = APP;
    pool = new pg.Pool({ connectionString: appUrl.toString() });
    boss = createPgBoss(appUrl.toString(), logger);
    await boss.start();
  });

  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await pool?.end();
    await owner?.end();
    await container?.stop();
  });

  const seedDocument = async (declaredType: string | null = null) => {
    const [familyId, profileId, batchId, documentId, accountId] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];
    await owner.query(`INSERT INTO families(id, name) VALUES ($1, 'Nhà')`, [familyId]);
    await owner.query(
      `INSERT INTO accounts(id, oidc_subject, display_name, family_id, family_role) VALUES ($1, $3, 'Main', $2, 'main')`,
      [accountId, familyId, `sub-${accountId}`],
    );
    await owner.query(`INSERT INTO health_profiles(id, family_id, display_name) VALUES ($1, $2, 'Mẹ')`, [
      profileId,
      familyId,
    ]);
    await owner.query(
      `INSERT INTO upload_batches(id, family_id, health_profile_id, created_by) VALUES ($1, $2, $3, $4)`,
      [batchId, familyId, profileId, accountId],
    );
    await owner.query(
      `INSERT INTO source_documents(id, family_id, health_profile_id, batch_id, type, status, original_key, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, 'uploaded', 'k/original.jpg', 'image/jpeg', 3)`,
      [documentId, familyId, profileId, batchId, declaredType],
    );
    return { familyId, documentId };
  };
  const documentState = async (documentId: string) =>
    (
      await owner.query(
        `SELECT d.status, d.type, count(e.id)::int AS extractions FROM source_documents d
         LEFT JOIN extractions e ON e.source_document_id = d.id WHERE d.id = $1 GROUP BY d.id`,
        [documentId],
      )
    ).rows[0];

  it('role app khởi động pg-boss với migrate:false; job gửi qua hàng đợi → pending_review + Extraction', async () => {
    const { familyId, documentId } = await seedDocument();
    await registerExtractDocumentJob(boss, handleExtractDocumentJob(deps(), logger));
    await boss.send(EXTRACT_DOCUMENT_QUEUE, { documentId, familyId });
    await expect
      .poll(() => documentState(documentId), { timeout: 15_000, interval: 250 })
      .toEqual({
        status: 'pending_review',
        type: 'prescription',
        extractions: 1,
      });
    const extraction = await owner.query('SELECT family_id, provider, payload FROM extractions');
    expect(extraction.rows[0]).toMatchObject({ family_id: familyId, provider: 'fake' });
    expect(extraction.rows[0].payload.items[0].name).toBe('Amlodipin');
  });

  it('SPEC-006: familyId của job không khớp chứng từ → RLS che, bỏ qua, chứng từ giữ uploaded', async () => {
    const { documentId } = await seedDocument();
    const other = await seedDocument();
    const handler = handleExtractDocumentJob(deps(), logger);
    const outcome = await handler({
      id: 'j',
      data: { documentId, familyId: other.familyId },
      retryCount: 0,
      retryLimit: 2,
    });
    expect(outcome).toEqual({ status: 'skipped' });
    expect(await documentState(documentId)).toMatchObject({ status: 'uploaded', extractions: 0 });
  });

  it('khai lab_result nhưng AI trả đơn thuốc → manual_entry, không tạo Extraction', async () => {
    const { familyId, documentId } = await seedDocument('lab_result');
    const handler = handleExtractDocumentJob(deps(), logger);
    await handler({ id: 'j', data: { documentId, familyId }, retryCount: 0, retryLimit: 2 });
    expect(await documentState(documentId)).toEqual({
      status: 'manual_entry',
      type: 'lab_result',
      extractions: 0,
    });
  });
});
