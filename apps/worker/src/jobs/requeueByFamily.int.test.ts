import { EXTRACT_DOCUMENT_QUEUE, ensureExtractDocumentQueues } from '@angia/contracts';
import { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBudgetRequeueRepository } from '@src/features/extraction/infrastructure/createBudgetRequeueRepository.js';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { seedOcrGate } from '@src/shared/test/seedOcrGate.js';
import { seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { handleRequeueAwaitingBudgetJob } from './handleRequeueAwaitingBudgetJob.js';

const logger = pino({ level: 'silent' });
const NOW = new Date('2026-10-15T03:00:00Z'); // tháng ngân sách 2026-10 giờ Việt Nam

describe('Requeue awaiting_budget theo gia đình trên PostgreSQL + pg-boss thật (SPEC-031)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  let boss: PgBoss;
  const setSpend = (spent: number) =>
    fx.owner.query(
      `INSERT INTO extraction_spend(month, spent_usd, cap_usd) VALUES ('2026-10', $1, 5) ON CONFLICT (month) DO UPDATE SET spent_usd = $1`,
      [spent],
    );
  const status = async (id: string) =>
    (await fx.owner.query('SELECT status FROM source_documents WHERE id=$1', [id])).rows[0].status;

  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
    boss = new PgBoss({ connectionString: fx.appUrl, migrate: false, createSchema: false });
    await boss.start();
    await ensureExtractDocumentQueues(boss);
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await fx?.close();
  });

  it('TC-307: requeue bỏ qua gia đình hết quota; job kèm familyId chỉ chạm gia đình đó', async () => {
    await fx.owner.query(`DELETE FROM pgboss.job WHERE name = $1`, [EXTRACT_DOCUMENT_QUEUE]);
    await fx.owner.query(
      `UPDATE source_documents SET status = 'manual_entry' WHERE status = 'awaiting_budget'`,
    );
    const a = await seedExtractingDocument(fx.owner);
    const b = await seedExtractingDocument(fx.owner);
    await setSpend(0);
    await seedOcrGate(fx.owner, a.familyId, NOW, 5);
    await seedOcrGate(fx.owner, b.familyId, NOW, 0);
    await fx.owner.query(`UPDATE source_documents SET status='awaiting_budget' WHERE id = ANY($1)`, [
      [a.documentId, b.documentId],
    ]);
    const policy = {
      estimatedCostUsd: 0.02,
      defaultMonthlyCapUsd: 5,
      defaultFamilyCapUsd: 0.5,
      defaultMonthlyScans: 0,
      now: () => NOW,
    };
    const repo = createBudgetRequeueRepository(fx.pool, boss, () => NOW);
    const handle = handleRequeueAwaitingBudgetJob(repo, policy, logger);
    await handle({ id: 'r1', data: { familyId: b.familyId } });
    expect(await status(b.documentId)).toBe('awaiting_budget');
    expect(await status(a.documentId)).toBe('awaiting_budget');
    await handle({ id: 'r2', data: {} });
    expect(await status(a.documentId)).toBe('extracting');
    expect(await status(b.documentId)).toBe('awaiting_budget');
    await expect(handle({ id: 'r3', data: { familyId: 'x' } })).rejects.toThrow();
  });

  it('TC-307: requeue giữ thứ tự created_at trong gia đình (job cũ hơn được lấy trước)', async () => {
    await fx.owner.query(`DELETE FROM pgboss.job WHERE name = $1`, [EXTRACT_DOCUMENT_QUEUE]);
    await fx.owner.query(
      `UPDATE source_documents SET status = 'manual_entry' WHERE status = 'awaiting_budget'`,
    );
    const first = await seedExtractingDocument(fx.owner);
    await seedOcrGate(fx.owner, first.familyId, NOW, 10);
    const ids = [first.documentId];
    for (const minutesAgo of [20, 30, 10]) {
      const copy = await seedExtractingDocument(fx.owner);
      await fx.owner.query(
        `UPDATE source_documents SET status = 'awaiting_budget', created_at = now() - make_interval(mins => $2) WHERE id = $1`,
        [copy.documentId, minutesAgo],
      );
      await fx.owner.query(`UPDATE source_documents SET family_id = family_id WHERE id = $1`, [
        copy.documentId,
      ]);
      ids.push(copy.documentId);
    }
    await fx.owner.query(
      `UPDATE source_documents SET status = 'awaiting_budget', created_at = now() - interval '40 minutes' WHERE id = $1`,
      [first.documentId],
    );
    const policy = {
      estimatedCostUsd: 0.02,
      defaultMonthlyCapUsd: 5,
      defaultFamilyCapUsd: 0.5,
      defaultMonthlyScans: 0,
      now: () => NOW,
    };
    await setSpend(0);
    // Mỗi chứng từ một gia đình riêng (seed) → gom về gia đình của first để kiểm thứ tự trong một gia đình.
    for (const id of ids.slice(1)) {
      await fx.owner.query(
        `INSERT INTO source_documents (id, family_id, health_profile_id, batch_id, type, status, original_key, mime_type,
           size_bytes, ocr_image_key, ocr_image_sha256, privacy_approved_by, privacy_approved_at, created_at)
         SELECT gen_random_uuid(), s.family_id, s.health_profile_id, s.batch_id, s.type, 'awaiting_budget',
           s.original_key || '-' || o.id, s.mime_type, s.size_bytes, s.ocr_image_key || '-' || o.id, s.ocr_image_sha256,
           s.privacy_approved_by, s.privacy_approved_at, o.created_at
         FROM source_documents s, source_documents o WHERE s.id = $1::uuid AND o.id = $2::uuid`,
        [first.documentId, id],
      );
    }
    await handleRequeueAwaitingBudgetJob(
      createBudgetRequeueRepository(fx.pool, boss, () => NOW),
      policy,
      logger,
    )({
      id: 'order',
      data: { familyId: first.familyId },
    });
    const jobs = await fx.owner.query(
      `SELECT j.data->>'documentId' AS id FROM pgboss.job j WHERE j.name = $1 ORDER BY j.priority DESC, j.created_on`,
      [EXTRACT_DOCUMENT_QUEUE],
    );
    const created = await fx.owner.query(
      `SELECT id FROM source_documents WHERE id = ANY($1::uuid[]) ORDER BY created_at, id`,
      [jobs.rows.map((row) => row.id)],
    );
    expect(jobs.rows).toHaveLength(4);
    expect(jobs.rows.map((row) => row.id)).toEqual(created.rows.map((row) => row.id));
  });
});
