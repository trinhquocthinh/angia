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
  estimatedCostUsd: 0.02,
  defaultMonthlyCapUsd: 10,
  defaultFamilyCapUsd: 0,
  defaultMonthlyScans: 10,
};
describe('CP5.5: lượt mặc định mỗi gia đình trên PostgreSQL thật', () => {
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
    for (const provider of ['openrouter'])
      await fx.owner.query(
        `INSERT INTO ai_billing_sources
      (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), NOW],
      );
  });
  const ledger = <T>(work: (store: ReturnType<typeof createBudgetLedger>) => Promise<T>) =>
    withFamilyScope(fx.pool, ids.familyId, (client) => work(createBudgetLedger(client, ids.familyId)));
  const state = async () =>
    (
      await fx.owner.query(
        `SELECT q.status, q.granted_scans::int AS granted, q.used_scans::int AS used, q.held_scans::int AS held,
          q.updated_by, m.committed_remaining_scans::int AS committed, m.quota_families::int AS families,
          m.used_scans::int AS month_used
        FROM scan_quota_months m LEFT JOIN family_scan_quotas q ON q.month=m.month AND q.family_id=$1
        WHERE m.month=$2`,
        [ids.familyId, MONTH],
      )
    ).rows[0];

  it('TC-637: lần giữ lượt đầu tháng tạo dòng default từ env, cộng committed và số gia đình đúng một lần', async () => {
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    expect(await state()).toEqual({
      status: 'default',
      granted: 10,
      used: 0,
      held: 1,
      updated_by: null,
      committed: 10,
      families: 1,
      month_used: 0,
    });
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    expect(await state()).toMatchObject({ granted: 10, held: 1, committed: 10, families: 1 });
  });

  it('TC-637: gia đình đã có dòng Admin cấp thì không ghi đè', async () => {
    await fx.owner.query(
      'INSERT INTO scan_quota_months(month,committed_remaining_scans,quota_families) VALUES ($1,30,1)',
      [MONTH],
    );
    await fx.owner.query(
      `INSERT INTO family_scan_quotas(family_id,month,status,granted_scans,updated_at,updated_by)
      SELECT $1,$2,'approved',30,$3,id FROM accounts WHERE family_id=$1`,
      [ids.familyId, MONTH, NOW],
    );
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    expect(await state()).toMatchObject({
      status: 'approved',
      granted: 30,
      held: 1,
      committed: 30,
      families: 1,
    });
  });

  it('TC-638: dispatch đầu tăng tổng lượt đã dùng của tháng', async () => {
    await ledger((store) => store.reserveBudget(ids.documentId, call));
    await ledger((store) => store.dispatchBudget(ids.documentId, call));
    await ledger((store) => store.dispatchBudget(ids.documentId, call));
    expect(await state()).toMatchObject({ used: 1, held: 0, committed: 9, month_used: 1 });
  });
});
