import { createHash } from 'node:crypto';
import {
  EXTRACT_DOCUMENT_QUEUE,
  REQUEUE_AWAITING_BUDGET_QUEUE,
  ensureExtractDocumentQueues,
  type ExtractionPayload,
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
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';
import { handleRecoverDeadExtractionJob } from './handleRecoverDeadExtractionJob.js';
import { registerRecoverDeadExtractionJob } from './registerRecoverDeadExtractionJob.js';
import { registerRequeueAwaitingBudgetJob } from './registerRequeueAwaitingBudgetJob.js';

const logger = pino({ level: 'silent' });
const NOW = new Date('2026-10-15T03:00:00Z'); // tháng ngân sách 2026-10 giờ Việt Nam
const PAYLOAD: ExtractionPayload = {
  type: 'device_reading',
  measuredAt: '2026-10-01',
  measuredTime: '07:00',
  kind: 'blood_pressure',
  systolic: 130,
  diastolic: 80,
  pulse: 72,
  glucoseValue: null,
  glucoseUnit: null,
};

// Chi phí thật của mỗi lời gọi $0.00113 (đo dev OpenRouter E2-S5-T2); delay/lỗi để tái hiện tranh chấp và retry.
function countingExtractor(options: { delayMs?: number; error?: Error } = {}) {
  const calls: number[] = [];
  const extractor: DocumentExtractor = {
    extract: async () => {
      calls.push(Date.now());
      await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 0));
      if (options.error) throw options.error;
      return { ok: true, content: PAYLOAD, provider: 'openrouter', model: 'gemini', costUsd: 0.00113 };
    },
  };
  return { extractor, calls };
}

describe('Ngân sách AI trên PostgreSQL + pg-boss thật (E3-S6-T1, BR-018, F03a, F08a)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  let boss: PgBoss;
  const deps = (extractor: DocumentExtractor): ExtractionDependencies => ({
    repository: createExtractionRepository(fx.pool),
    budget: { estimatedCostUsd: 0.02, defaultMonthlyCapUsd: 5, now: () => NOW },
    storage: { get: async () => APPROVED_OCR_BYTES },
    images: { heicToJpeg: async (bytes) => bytes },
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
    handleExtractDocumentJob(deps(extractor), logger)({ id: 'j', data, retryCount, retryLimit: 2 });
  const setSpend = (spent: number, month = '2026-10', cap = 5) =>
    fx.owner.query('INSERT INTO extraction_spend(month, spent_usd, cap_usd) VALUES ($1,$2,$3)', [
      month,
      spent,
      cap,
    ]);
  const spend = async (month = '2026-10') =>
    (await fx.owner.query('SELECT spent_usd, cap_usd FROM extraction_spend WHERE month=$1', [month])).rows[0];
  const status = async (id: string) =>
    (await fx.owner.query('SELECT status FROM source_documents WHERE id=$1', [id])).rows[0].status;
  const reservations = async () =>
    (await fx.owner.query('SELECT count(*)::int AS n FROM extraction_reservations')).rows[0].n;

  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
    // Hết hạn job chạy trong lượt monitor (mặc định 60 s); rút còn 1 s để tái hiện worker chết nhanh.
    boss = new PgBoss({
      connectionString: fx.appUrl,
      migrate: false,
      createSchema: false,
      superviseIntervalSeconds: 1,
      monitorIntervalSeconds: 1,
    });
    await boss.start();
    await ensureExtractDocumentQueues(boss);
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await fx?.close();
  });
  beforeEach(async () => {
    await fx.owner.query('DELETE FROM extraction_reservations; DELETE FROM extraction_spend');
  });

  it('TC-027: đã dùng $1.00 / trần $5.00 → pending_review, chi phí tháng tăng đúng chi phí thực', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setSpend(1);
    expect(await run(countingExtractor().extractor, doc)).toMatchObject({ status: 'pending_review' });
    expect(await spend()).toEqual({ spent_usd: '1.001130', cap_usd: '5.00' });
    expect(await reservations()).toBe(0);
  });

  it('TC-028: đã dùng $4.99 / trần $5.00, ước tính $0.02 → awaiting_budget, không gọi AI', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setSpend(4.99);
    const ai = countingExtractor();
    expect(await run(ai.extractor, doc)).toEqual({ status: 'awaiting_budget' });
    expect(ai.calls).toHaveLength(0);
    expect(await status(doc.documentId)).toBe('awaiting_budget');
    expect((await spend()).spent_usd).toBe('4.990000');
  });

  it('TC-083: đã dùng $4.98 / trần $5.00, ước tính $0.02 → được xử lý (≤ trần)', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setSpend(4.98);
    expect(await run(countingExtractor().extractor, doc)).toMatchObject({ status: 'pending_review' });
    expect((await spend()).spent_usd).toBe('4.981130');
  });

  it('TC-041: đã dùng $3.00, Quản trị viên hạ trần còn $2.00 → chứng từ kế tiếp awaiting_budget, không gọi AI', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setSpend(3, '2026-10', 2);
    const ai = countingExtractor();
    expect(await run(ai.extractor, doc)).toEqual({ status: 'awaiting_budget' });
    expect(ai.calls).toHaveLength(0);
    expect(await status(doc.documentId)).toBe('awaiting_budget');
  });

  it('tháng mới chép trần của tháng gần nhất; chưa có tháng nào thì lấy trần mặc định', async () => {
    await setSpend(2.9, '2026-09', 3);
    await run(countingExtractor().extractor, await seedExtractingDocument(fx.owner));
    expect(await spend()).toEqual({ spent_usd: '0.001130', cap_usd: '3.00' });
    await fx.owner.query('DELETE FROM extraction_spend');
    await run(countingExtractor().extractor, await seedExtractingDocument(fx.owner));
    expect((await spend()).cap_usd).toBe('5.00');
  });

  it('F03a: 6 chứng từ đồng thời, trần chỉ còn 3 chỗ → đúng 3 lời gọi AI, không vượt trần', async () => {
    const docs = await Promise.all(Array.from({ length: 6 }, () => seedExtractingDocument(fx.owner)));
    await setSpend(4.94);
    const ai = countingExtractor({ delayMs: 300 });
    const outcomes = await Promise.all(docs.map((doc) => run(ai.extractor, doc)));
    expect(ai.calls).toHaveLength(3);
    expect(outcomes.filter((o) => o.status === 'awaiting_budget')).toHaveLength(3);
    expect((await spend()).spent_usd).toBe('4.943390');
    expect(await reservations()).toBe(0);
  });

  it('lỗi mạng chưa hết lượt: trả lại chỗ giữ; lần thử lại thành công chỉ tính một lần', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setSpend(1);
    await expect(run(countingExtractor({ error: new Error('mạng') }).extractor, doc)).rejects.toThrow();
    expect({ ...(await spend()), held: await reservations() }).toMatchObject({
      spent_usd: '1.000000',
      held: 0,
    });
    expect(await status(doc.documentId)).toBe('extracting');
    await run(countingExtractor().extractor, doc, 1);
    expect((await spend()).spent_usd).toBe('1.001130');
  });

  it('TC-030: job đầu tháng đưa awaiting_budget của mọi gia đình về extracting và enqueue cùng transaction', async () => {
    const a = await seedExtractingDocument(fx.owner);
    const b = await seedExtractingDocument(fx.owner);
    const untouched = await seedExtractingDocument(fx.owner);
    await fx.owner.query(`UPDATE source_documents SET status='awaiting_budget' WHERE id = ANY($1)`, [
      [a.documentId, b.documentId],
    ]);
    await registerRequeueAwaitingBudgetJob(boss, createBudgetRequeueRepository(fx.pool, boss), logger);
    expect(await boss.getSchedules()).toContainEqual(
      expect.objectContaining({
        name: REQUEUE_AWAITING_BUDGET_QUEUE,
        cron: '5 0 1 * *',
        timezone: 'Asia/Ho_Chi_Minh',
      }),
    );
    await boss.send(REQUEUE_AWAITING_BUDGET_QUEUE, {});
    await expect.poll(() => status(b.documentId), { timeout: 15_000, interval: 250 }).toBe('extracting');
    expect(await status(a.documentId)).toBe('extracting');
    const jobs = await fx.owner.query(`SELECT data FROM pgboss.job WHERE name = $1`, [
      EXTRACT_DOCUMENT_QUEUE,
    ]);
    expect(jobs.rows.map((row) => row.data)).toEqual(expect.arrayContaining([a, b]));
    expect(jobs.rows.map((row) => row.data)).not.toContainEqual(untouched);
  });

  it('F08a/nợ #20: worker chết ở lần thử cuối → dead-letter chuyển manual_entry, trả chỗ giữ; job đang sống giữ nguyên', async () => {
    await fx.owner.query(`DELETE FROM pgboss.job WHERE name = $1`, [EXTRACT_DOCUMENT_QUEUE]);
    const dead = await seedExtractingDocument(fx.owner);
    const alive = await seedExtractingDocument(fx.owner);
    await setSpend(1.02);
    await fx.owner.query(
      `INSERT INTO extraction_reservations(source_document_id, family_id, month, amount_usd) VALUES ($1,$2,'2026-10',0.02)`,
      [dead.documentId, dead.familyId],
    );
    await boss.send(EXTRACT_DOCUMENT_QUEUE, dead, { retryLimit: 0, expireInSeconds: 1 });
    await boss.send(EXTRACT_DOCUMENT_QUEUE, alive, { retryLimit: 0, expireInSeconds: 600 });
    // Worker lấy cả hai job rồi "chết": không bao giờ hoàn tất.
    expect(await boss.fetch(EXTRACT_DOCUMENT_QUEUE, { batchSize: 10 })).toHaveLength(2);
    await registerRecoverDeadExtractionJob(
      boss,
      handleRecoverDeadExtractionJob(deps(countingExtractor().extractor), logger),
    );
    await expect.poll(() => status(dead.documentId), { timeout: 20_000, interval: 250 }).toBe('manual_entry');
    expect((await spend()).spent_usd).toBe('1.000000');
    expect(await reservations()).toBe(0);
    expect(await status(alive.documentId)).toBe('extracting');
  });
});
