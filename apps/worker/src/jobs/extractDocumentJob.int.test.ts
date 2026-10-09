import { prepareDocumentPreview } from '@src/features/documentPreview/application/prepareDocumentPreview.js';
import { createPreviewRepository } from '@src/features/documentPreview/infrastructure/createPreviewRepository.js';
import { handleConvertHeicJob } from './handleConvertHeicJob.js';
import { registerConvertHeicJob } from './registerConvertHeicJob.js';
import { createHash, randomUUID } from 'node:crypto';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { fileURLToPath } from 'node:url';
import { CONVERT_HEIC_QUEUE, EXTRACT_DOCUMENT_QUEUE } from '@angia/contracts';
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
    budget: { estimatedCostUsd: 0.02, defaultMonthlyCapUsd: 5, now: () => new Date() },
    storage: { get: async () => new Uint8Array([0xff, 0xd8, 0xff]) },
    images: { heicToJpeg: async (bytes) => bytes },
    extractor: createFakeExtractor(),
    ocrImages: {
      get: async () => ({
        bytes: APPROVED_OCR_BYTES,
        mimeType: 'image/jpeg',
        sha256: createHash('sha256').update(APPROVED_OCR_BYTES).digest('hex'),
      }),
    },
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

  const seedDocument = (declaredType: string | null = null, approved = true) =>
    seedExtractingDocument(owner, declaredType, approved);
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

  it('SPEC-006: familyId của job không khớp chứng từ → RLS che, bỏ qua, chứng từ giữ extracting', async () => {
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
    expect(await documentState(documentId)).toMatchObject({ status: 'extracting', extractions: 0 });
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
  const previewDeps = () => ({
    repository: createPreviewRepository(pool),
    newId: randomUUID,
    images: { toWebp: async () => new Uint8Array([1, 2, 3]) },
    storage: { get: async () => new Uint8Array([1]), put: async () => {}, delete: async () => {} },
  });
  it('TC-156: job convert-heic thật → lưu previewKey, awaiting_privacy; RLS/CAS chặn nhóm khác và job lặp', async () => {
    const own = await seedDocument(null, false);
    const other = await seedDocument(null, false);
    expect(
      await prepareDocumentPreview(previewDeps(), { ...own, familyId: other.familyId, finalAttempt: false }),
    ).toEqual({ status: 'skipped' });
    await registerConvertHeicJob(boss, handleConvertHeicJob(previewDeps(), logger));
    await boss.send(CONVERT_HEIC_QUEUE, own);
    await expect
      .poll(() => documentState(own.documentId), { timeout: 15000, interval: 250 })
      .toMatchObject({ status: 'awaiting_privacy', extractions: 0 });
    const row = (
      await owner.query('SELECT preview_key, original_key FROM source_documents WHERE id=$1', [
        own.documentId,
      ])
    ).rows[0];
    expect(row.preview_key).toContain(`families/${own.familyId}/`);
    expect(row.preview_key).toMatch(/\.webp$/);
    expect(row.original_key).toMatch(/original\.jpg$/);
    expect(await prepareDocumentPreview(previewDeps(), { ...own, finalAttempt: false })).toEqual({
      status: 'skipped',
    });
    expect(await documentState(other.documentId)).toMatchObject({ status: 'uploaded', extractions: 0 });
  });
  it('TC-157: job OCR cũ thiếu xác nhận → manual_entry, không tạo Extraction', async () => {
    const own = await seedDocument(null, false);
    expect(
      await handleExtractDocumentJob(
        deps(),
        logger,
      )({ id: 'legacy', data: own, retryCount: 0, retryLimit: 2 }),
    ).toMatchObject({ status: 'manual_entry', reason: 'privacy_required', costUsd: 0 });
    expect(await documentState(own.documentId)).toMatchObject({ status: 'manual_entry', extractions: 0 });
  });
});
