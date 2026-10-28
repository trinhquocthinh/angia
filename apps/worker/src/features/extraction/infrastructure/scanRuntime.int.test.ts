import { randomUUID } from 'node:crypto';
import { budgetMonth } from '@angia/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { createBudgetLedger } from './createBudgetLedger.js';

const NOW = new Date();
const MONTH = budgetMonth(NOW);
const call = {
  month: MONTH,
  defaultMonthlyCapUsd: 5,
  defaultMonthlyScans: 0,
};
describe('CP5.4: giữ và dispatch lượt trên PostgreSQL thật', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  let ids: Awaited<ReturnType<typeof seedExtractingDocument>>;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  beforeEach(async () => {
    await fx.owner.query(
      'TRUNCATE families, scan_quota_policy, scan_quota_months, extraction_spend, ai_billing_sources CASCADE',
    );
    ids = await seedExtractingDocument(fx.owner);
    await fx.owner.query('INSERT INTO scan_quota_policy(id) VALUES (1)');
    await fx.owner.query('INSERT INTO scan_quota_months(month,committed_remaining_scans) VALUES ($1,2)', [
      MONTH,
    ]);
    await fx.owner.query('INSERT INTO extraction_spend(month,cap_usd) VALUES ($1,5)', [MONTH]);
    await fx.owner.query(
      `INSERT INTO family_scan_quotas(family_id,month,status,granted_scans,updated_at,updated_by)
      SELECT $1,$2,'approved',2,$3,id FROM accounts WHERE family_id=$1`,
      [ids.familyId, MONTH, NOW],
    );
    for (const provider of ['openrouter'])
      await fx.owner.query(
        `INSERT INTO ai_billing_sources
      (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), NOW],
      );
  });
  const ledger = <T>(work: (store: ReturnType<typeof createBudgetLedger>) => Promise<T>) =>
    withFamilyScope(fx.pool, ids.familyId, (client) => work(createBudgetLedger(client, ids.familyId)));
  const counts = async () =>
    (
      await fx.owner.query(
        `SELECT used_scans::int AS used,held_scans::int AS held,
    (SELECT committed_remaining_scans::int FROM scan_quota_months WHERE month=$2) AS committed
    FROM family_scan_quotas WHERE family_id=$1 AND month=$2`,
        [ids.familyId, MONTH],
      )
    ).rows[0];
  it('TC-604: giữ lượt nguyên tử, không còn áp trần tiền gia đình', async () => {
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    expect(await counts()).toEqual({ used: 0, held: 1, committed: 2 });
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    expect(await counts()).toEqual({ used: 0, held: 1, committed: 2 });
  });
  it('TC-605: dispatch nhiều lần chỉ trừ một lượt, trả chỗ sau timeout không hoàn lượt đã dùng', async () => {
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    await ledger((store) => store.dispatchBudget(ids.documentId, call));
    await ledger((store) => store.dispatchBudget(ids.documentId, call));
    await ledger((store) => store.settleBudget(ids.documentId, 0, call));
    expect(await counts()).toEqual({ used: 1, held: 0, committed: 1 });
    expect(
      (await fx.owner.query('SELECT spent_usd::text AS spent FROM extraction_spend')).rows[0].spent,
    ).toBe('0.000000');
  });
  it('TC-606: trả held trước dispatch và xóa hồ sơ trả held, không thay cam kết', async () => {
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    await ledger((store) => store.settleBudget(ids.documentId, 0, call));
    expect(await counts()).toEqual({ used: 0, held: 0, committed: 2 });
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    await fx.owner.query('DELETE FROM health_profiles WHERE family_id=$1', [ids.familyId]);
    expect(await counts()).toEqual({ used: 0, held: 0, committed: 2 });
  });
  it('TC-649: chỉ cần nguồn OpenRouter; không có nguồn phí nào thì chặn và không giữ lượt', async () => {
    await fx.owner.query('TRUNCATE ai_billing_sources CASCADE');
    await expect(ledger((store) => store.reserveBudget(ids.documentId, call))).rejects.toMatchObject({
      reason: 'billing_unavailable',
    });
    expect(await counts()).toEqual({ used: 0, held: 0, committed: 2 });
    await fx.owner.query(
      `INSERT INTO ai_billing_sources(id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at)
      VALUES ($1,'openrouter',$2,'complete',$3,$3)`,
      [randomUUID(), randomUUID(), NOW],
    );
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    expect(await counts()).toEqual({ used: 0, held: 1, committed: 2 });
  });
  it('TC-607: nguồn stale hoặc phí đạt trần đều chặn mà không giữ lượt', async () => {
    await fx.owner.query("UPDATE ai_billing_sources SET last_complete_at=now()-interval '4 minutes'");
    await expect(ledger((store) => store.reserveBudget(ids.documentId, call))).rejects.toMatchObject({
      reason: 'billing_unavailable',
    });
    expect(await counts()).toEqual({ used: 0, held: 0, committed: 2 });
    await fx.owner.query('UPDATE ai_billing_sources SET last_complete_at=$1', [NOW]);
    const source = (await fx.owner.query("SELECT id FROM ai_billing_sources WHERE provider='openrouter'"))
      .rows[0].id;
    await fx.owner.query(
      `INSERT INTO ai_provider_charges(source_id,external_id,charged_at,counter_amount,unit_divisor)
      VALUES ($1,'charge',$2,5,1)`,
      [source, NOW],
    );
    await expect(ledger((store) => store.reserveBudget(ids.documentId, call))).rejects.toMatchObject({
      reason: 'budget_exhausted',
    });
  });
  it('TC-608: hết quota, hết sáu lần gửi và RLS chặn gia đình khác', async () => {
    await fx.owner.query('UPDATE family_scan_quotas SET granted_scans=0');
    await expect(ledger((store) => store.reserveBudget(ids.documentId, call))).rejects.toMatchObject({
      reason: 'scan_quota_exhausted',
    });
    await fx.owner.query('UPDATE family_scan_quotas SET granted_scans=2');
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    for (let i = 0; i < 6; i++) await ledger((store) => store.dispatchBudget(ids.documentId, call));
    await expect(ledger((store) => store.dispatchBudget(ids.documentId, call))).rejects.toMatchObject({
      reason: 'dispatch_limit',
    });
    await withFamilyScope(fx.pool, randomUUID(), async (client) => {
      expect((await client.query('SELECT * FROM ocr_operations')).rowCount).toBe(0);
      expect((await client.query('SELECT * FROM family_scan_quotas')).rowCount).toBe(0);
    });
    expect(await counts()).toEqual({ used: 1, held: 0, committed: 1 });
  });
});
