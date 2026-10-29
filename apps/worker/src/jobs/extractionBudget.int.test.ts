import { createHash } from 'node:crypto';
import {
  EXTRACT_DOCUMENT_QUEUE,
  REQUEUE_AWAITING_BUDGET_QUEUE,
  ensureExtractDocumentQueues,
} from '@angia/contracts';
import { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type {
  DocumentExtractor,
  ExtractionDependencies,
} from '@src/features/extraction/application/ports.js';
import { createBudgetRequeueRepository } from '@src/features/extraction/infrastructure/createBudgetRequeueRepository.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { seedOcrGate } from '@src/shared/test/seedOcrGate.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';
import { handleRecoverDeadExtractionJob } from './handleRecoverDeadExtractionJob.js';
import { registerRequeueAwaitingBudgetJob } from './registerRequeueAwaitingBudgetJob.js';

const logger = pino({ level: 'silent' });
const NOW = new Date('2026-10-15T03:00:00Z');
const policy = {
  defaultMonthlyCapUsd: 5,
  defaultMonthlyScans: 0,
  now: () => NOW,
};
function countingExtractor(error?: Error) {
  const calls: number[] = [];
  const extractor: DocumentExtractor = {
    extract: async (_image, beforeDispatch) => {
      await beforeDispatch?.();
      calls.push(1);
      if (error) throw error;
      return {
        ok: true,
        content: { type: 'prescription', items: [{ name: 'A' }] },
        provider: 'fake',
        model: 'fake',
        costUsd: 0.00113,
      };
    },
  };
  return { extractor, calls };
}

describe('CP5.4: vòng đời worker, quota, billing, phục hồi và pg-boss thật', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  let boss: PgBoss;
  const deps = (extractor: DocumentExtractor): ExtractionDependencies => ({
    repository: createExtractionRepository(fx.pool, () => NOW),
    budget: policy,
    extractor,
    ocrImages: {
      get: async () => ({
        bytes: APPROVED_OCR_BYTES,
        mimeType: 'image/jpeg',
        sha256: createHash('sha256').update(APPROVED_OCR_BYTES).digest('hex'),
      }),
    },
  });
  const run = (extractor: DocumentExtractor, data: object, retryCount = 0) =>
    handleExtractDocumentJob(deps(extractor), logger)({ id: 'job', data, retryCount, retryLimit: 2 });
  const seed = async (quota = 2) => {
    const doc = await seedExtractingDocument(fx.owner);
    await seedOcrGate(fx.owner, doc.familyId, NOW, quota);
    return doc;
  };
  const state = async (id: string) =>
    (
      await fx.owner.query(
        `SELECT d.status,q.used_scans::int AS used,q.held_scans::int AS held
    FROM source_documents d JOIN family_scan_quotas q ON q.family_id=d.family_id AND q.month='2026-10' WHERE d.id=$1`,
        [id],
      )
    ).rows[0];
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
    boss = new PgBoss({ connectionString: fx.appUrl, migrate: false, createSchema: false });
    await boss.start();
    await ensureExtractDocumentQueues(boss);
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await fx?.close();
  });
  beforeEach(async () => {
    await fx.owner.query(
      'TRUNCATE families,scan_quota_policy,scan_quota_months,extraction_spend,ai_billing_sources CASCADE',
    );
    await fx.owner.query('DELETE FROM pgboss.job');
  });

  it('TC-027: kết quả thành công dùng một lượt, không cộng tiền OCR vào phí đối soát', async () => {
    const doc = await seed();
    await fx.owner.query(`INSERT INTO extraction_spend(month,spent_usd,cap_usd) VALUES('2026-10',1,5)`);
    expect(await run(countingExtractor().extractor, doc)).toMatchObject({ status: 'pending_review' });
    expect(await state(doc.documentId)).toEqual({ status: 'pending_review', used: 1, held: 0 });
    expect((await fx.owner.query('SELECT spent_usd FROM extraction_spend')).rows[0].spent_usd).toBe(
      '1.000000',
    );
  });

  it('TC-028/TC-041: đạt trần phí thực hoặc coverage stale chặn trước đọc ảnh', async () => {
    const doc = await seed();
    const source = (await fx.owner.query("SELECT id FROM ai_billing_sources WHERE provider='openrouter'"))
      .rows[0].id;
    await fx.owner.query(
      `INSERT INTO ai_provider_charges(source_id,external_id,charged_at,counter_amount,unit_divisor)
      VALUES($1,'charge',$2,5,1)`,
      [source, NOW],
    );
    const ai = countingExtractor();
    expect(await run(ai.extractor, doc)).toEqual({ status: 'awaiting_budget', reason: 'budget_exhausted' });
    expect(ai.calls).toHaveLength(0);
    expect(await state(doc.documentId)).toEqual({ status: 'awaiting_budget', used: 0, held: 0 });
  });

  it('retry sau timeout không hoàn lượt đã gửi, chỉ thêm lần gửi trong cùng operation', async () => {
    const doc = await seed(1);
    await expect(run(countingExtractor(new Error('mạng')).extractor, doc)).rejects.toThrow('mạng');
    expect(await state(doc.documentId)).toEqual({ status: 'extracting', used: 1, held: 0 });
    await run(countingExtractor().extractor, doc, 1);
    expect(await state(doc.documentId)).toEqual({ status: 'pending_review', used: 1, held: 0 });
    expect(
      (await fx.owner.query('SELECT dispatch_attempts FROM ocr_operations')).rows[0].dispatch_attempts,
    ).toBe(2);
  });

  it('TC-030: lịch mỗi phút chỉ enqueue khi có quota cấp, không tự cấp tháng mới', async () => {
    const available = await seed(1);
    const exhausted = await seed(0);
    await fx.owner.query("UPDATE source_documents SET status='awaiting_budget'");
    const repo = createBudgetRequeueRepository(fx.pool, boss, () => NOW);
    await registerRequeueAwaitingBudgetJob(boss, repo, policy, logger);
    expect(await boss.getSchedules()).toContainEqual(
      expect.objectContaining({ name: REQUEUE_AWAITING_BUDGET_QUEUE, cron: '* * * * *' }),
    );
    expect(await repo.requeueFamily(available.familyId, { ...policy, month: '2026-10' })).toBe(1);
    expect(await repo.requeueFamily(exhausted.familyId, { ...policy, month: '2026-10' })).toBe(0);
    expect(
      (await fx.owner.query('SELECT data FROM pgboss.job WHERE name=$1', [EXTRACT_DOCUMENT_QUEUE])).rows.map(
        (row) => row.data,
      ),
    ).toEqual([available]);
  });

  it('F08a: dead-letter trả held dù đã chờ ngân sách, không hoàn used', async () => {
    const doc = await seed();
    await fx.owner.query(`UPDATE family_scan_quotas SET held_scans=1`);
    await fx.owner.query(
      `INSERT INTO ocr_operations(source_document_id,family_id,month,state) VALUES($1,$2,'2026-10','held')`,
      [doc.documentId, doc.familyId],
    );
    await fx.owner.query("UPDATE source_documents SET status='awaiting_budget'");
    await handleRecoverDeadExtractionJob(
      deps(countingExtractor().extractor),
      logger,
    )({ id: 'dead', data: doc });
    expect(await state(doc.documentId)).toEqual({ status: 'awaiting_budget', used: 0, held: 0 });
    await handleRecoverDeadExtractionJob(
      deps(countingExtractor().extractor),
      logger,
    )({ id: 'dead', data: doc });
    expect(await state(doc.documentId)).toEqual({ status: 'awaiting_budget', used: 0, held: 0 });
  });
  it.each(['created', 'retry', 'active'] as const)(
    'TC-632: job gốc %s ngăn dead-letter trùng hủy operation',
    async (liveState) => {
      const doc = await seed();
      await fx.owner.query('UPDATE family_scan_quotas SET held_scans=1');
      await fx.owner.query(
        "INSERT INTO ocr_operations(source_document_id,family_id,month,state) VALUES($1,$2,'2026-10','held')",
        [doc.documentId, doc.familyId],
      );
      const source = await boss.send(EXTRACT_DOCUMENT_QUEUE, doc);
      await fx.owner.query('UPDATE pgboss.job SET state=$2::pgboss.job_state WHERE id=$1', [
        source,
        liveState,
      ]);
      const recover = handleRecoverDeadExtractionJob(deps(countingExtractor().extractor), logger);
      expect(await recover({ id: 'duplicate-dead', data: doc })).toEqual({ status: 'skipped' });
      expect(await state(doc.documentId)).toEqual({ status: 'extracting', used: 0, held: 1 });
      await fx.owner.query("UPDATE pgboss.job SET state='failed' WHERE id=$1", [source]);
      expect(await recover({ id: 'original-dead', data: doc })).toEqual({ status: 'manual_entry' });
      expect(await state(doc.documentId)).toEqual({ status: 'manual_entry', used: 0, held: 0 });
    },
  );
});
