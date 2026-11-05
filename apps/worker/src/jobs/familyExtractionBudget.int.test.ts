import { randomUUID } from 'node:crypto';
import { budgetMonth } from '@angia/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { seedOcrGate } from '@src/shared/test/seedOcrGate.js';
import { createBudgetLedger } from '@src/features/extraction/infrastructure/createBudgetLedger.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';

// Thay kiểm trần USD gia đình SPEC-031 cũ bằng quota BR-018 CP5.4; vẫn kiểm tranh chấp và chuyển tháng.
describe('CP5.4: quota gia đình, khóa operation và tháng Việt Nam', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  let doc: Awaited<ReturnType<typeof seedExtractingDocument>>;
  let now: Date;
  const call = () => ({
    month: budgetMonth(now),
    defaultMonthlyCapUsd: 5,
    defaultMonthlyScans: 0,
  });
  const ledger = <T>(id: string, work: (store: ReturnType<typeof createBudgetLedger>) => Promise<T>) =>
    withFamilyScope(fx.pool, doc.familyId, (client) =>
      work(createBudgetLedger(client, doc.familyId, () => now)),
    );
  const reserve = (id = doc.documentId) => ledger(id, (store) => store.reserveBudget(id, call()));
  const dispatch = () => ledger(doc.documentId, (store) => store.dispatchBudget(doc.documentId, call()));
  const counters = async (month = budgetMonth(now)) =>
    (
      await fx.owner.query(
        `SELECT used_scans::int AS used,
    held_scans::int AS held FROM family_scan_quotas WHERE family_id=$1 AND month=$2`,
        [doc.familyId, month],
      )
    ).rows[0];
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  beforeEach(async () => {
    await fx.owner.query(
      'TRUNCATE families,scan_quota_months,scan_quota_policy,extraction_spend,ai_billing_sources CASCADE',
    );
    now = new Date('2026-10-31T16:59:59Z');
    doc = await seedExtractingDocument(fx.owner);
    await seedOcrGate(fx.owner, doc.familyId, now, 1);
  });
  async function cloneDocument() {
    const id = randomUUID();
    await fx.owner.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,image_key,image_sha256,mime_type,size_bytes)
      SELECT $1::uuid,family_id,health_profile_id,batch_id,'extracting',image_key||$1::text,image_sha256,'image/jpeg',3 FROM source_documents WHERE id=$2`,
      [id, doc.documentId],
    );
    return id;
  }
  it('TC-620: hai operation cạnh tranh một lượt chỉ giữ được một; không vượt quota', async () => {
    const second = await cloneDocument();
    const results = await Promise.allSettled([reserve(), reserve(second)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(await counters()).toEqual({ used: 0, held: 1 });
  });
  it('TC-621: hai worker cùng operation chỉ một giữ khóa; trả connection không để sót khóa', async () => {
    const repository = createExtractionRepository(fx.pool, () => now);
    let release!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const blocker = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = repository.runExclusive!(doc.familyId, doc.documentId, async (pinned) => {
      await pinned.withFamily(doc.familyId, (store) => store.reserveBudget(doc.documentId, call()));
      entered();
      await blocker;
      return 'first';
    });
    await started;
    try {
      expect(
        await repository.runExclusive!(doc.familyId, doc.documentId, async () => 'duplicate'),
      ).toBeNull();
    } finally {
      release();
    }
    expect(await first).toBe('first');
    expect(await repository.runExclusive!(doc.familyId, doc.documentId, async () => 'next')).toBe('next');
    expect(await counters()).toEqual({ used: 0, held: 1 });
  });
  it('TC-622: held qua tháng trả tháng cũ, giữ tháng mới; không sao chép quota đã cấp', async () => {
    await reserve();
    now = new Date('2026-10-31T17:00:01Z');
    // Nguồn phí đã đối soát nhưng chưa cấp lượt tháng mới: phải chặn và không tự gia hạn.
    await fx.owner.query('UPDATE ai_billing_sources SET last_attempt_at=$1,last_complete_at=$1', [now]);
    await expect(reserve()).rejects.toMatchObject({ reason: 'scan_quota_exhausted' });
    await seedOcrGate(fx.owner, doc.familyId, now, 2);
    await reserve();
    await dispatch();
    expect(await counters('2026-10')).toEqual({ used: 0, held: 0 });
    expect(await counters('2026-11')).toEqual({ used: 1, held: 0 });
    expect((await fx.owner.query('SELECT month,state FROM ocr_operations')).rows[0]).toEqual({
      month: '2026-11',
      state: 'dispatched',
    });
  });
  it('TC-623: đã dispatch tháng cũ retry tháng mới không trừ quota tháng mới', async () => {
    await reserve();
    await dispatch();
    now = new Date('2026-10-31T17:00:01Z');
    await fx.owner.query('UPDATE ai_billing_sources SET last_attempt_at=$1,last_complete_at=$1', [now]);
    await reserve();
    await dispatch();
    expect(await counters('2026-10')).toEqual({ used: 1, held: 0 });
    expect(await counters('2026-11')).toBeUndefined();
    expect((await fx.owner.query('SELECT month,dispatch_attempts FROM ocr_operations')).rows[0]).toEqual({
      month: '2026-10',
      dispatch_attempts: 2,
    });
  });
  it('TC-624: freshness kiểm sau khi chờ khóa, không gửi theo snapshot trước khi chờ', async () => {
    await reserve();
    const locker = await fx.pool.connect();
    await locker.query('BEGIN');
    await locker.query('SELECT id FROM scan_quota_policy WHERE id=1 FOR UPDATE');
    const pending = dispatch();
    const waiting = async () =>
      (
        await fx.owner.query(`SELECT count(*)::int AS n FROM pg_stat_activity
      WHERE query='SELECT id FROM scan_quota_policy WHERE id=1 FOR UPDATE' AND wait_event_type='Lock'`)
      ).rows[0].n;
    try {
      await expect.poll(waiting).toBe(1);
      now = new Date(now.getTime() + 181000);
    } finally {
      await locker.query('ROLLBACK');
      locker.release();
    }
    await expect(pending).rejects.toMatchObject({ reason: 'billing_unavailable' });
    expect(await counters('2026-10')).toEqual({ used: 0, held: 1 });
  });
  it('TC-625: xóa hồ sơ sau dispatch giữ nguyên lượt đã dùng', async () => {
    await reserve();
    await dispatch();
    await fx.owner.query('DELETE FROM health_profiles WHERE family_id=$1', [doc.familyId]);
    expect(await counters()).toEqual({ used: 1, held: 0 });
    expect((await fx.owner.query('SELECT * FROM ocr_operations')).rowCount).toBe(0);
  });
  it('TC-634: xóa hồ sơ đồng thời dispatch và cấp thêm không deadlock hoặc để sót held', async () => {
    await reserve();
    await fx.owner.query('BEGIN');
    await fx.owner.query('SELECT id FROM health_profiles WHERE family_id=$1 FOR UPDATE', [doc.familyId]);
    const repository = createExtractionRepository(fx.pool, () => now);
    const dispatching = repository.withFamily(doc.familyId, async (store) => {
      const document = await store.findDocument(doc.documentId);
      if (!document) return 'gone';
      await store.dispatchBudget(doc.documentId, call());
      return 'sent';
    });
    try {
      await expect
        .poll(async () => {
          await fx.owner.query('SELECT pg_stat_clear_snapshot()');
          return (
            await fx.owner.query(`SELECT count(*)::int AS n FROM pg_stat_activity
        WHERE query LIKE 'SELECT 1 FROM health_profiles%' AND wait_event_type='Lock'`)
          ).rows[0].n;
        })
        .toBe(1);
      await withFamilyScope(fx.pool, doc.familyId, async (client) => {
        await client.query('SELECT id FROM scan_quota_policy WHERE id=1 FOR UPDATE');
        await client.query("SELECT month FROM scan_quota_months WHERE month='2026-10' FOR UPDATE");
        await client.query('UPDATE family_scan_quotas SET granted_scans=granted_scans+1 WHERE family_id=$1', [
          doc.familyId,
        ]);
        await client.query(
          "UPDATE scan_quota_months SET committed_remaining_scans=committed_remaining_scans+1 WHERE month='2026-10'",
        );
      });
      await fx.owner.query('DELETE FROM health_profiles WHERE family_id=$1', [doc.familyId]);
      await fx.owner.query('COMMIT');
      expect(await dispatching).toBe('gone');
      expect(await counters()).toEqual({ used: 0, held: 0 });
      expect(
        (
          await fx.owner.query(
            "SELECT committed_remaining_scans::int AS committed FROM scan_quota_months WHERE month='2026-10'",
          )
        ).rows[0].committed,
      ).toBe(2);
    } finally {
      await fx.owner.query('ROLLBACK');
      await Promise.allSettled([dispatching]);
    }
  });
});
