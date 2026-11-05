import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
const START = new Date('2026-10-15T00:00:00Z');
async function waitForLock(t: AdminTestApp): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await t.owner.query(`SELECT pid FROM pg_stat_activity WHERE usename='angia_test_app'
      AND wait_event_type='Lock' AND pg_backend_pid()=ANY(pg_blocking_pids(pid))`);
    if (result.rowCount === 1) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Không thấy giao dịch quota chờ khóa do fixture giữ');
}
describe('Đồng hồ quota sau khi chờ khóa ngân sách và gia đình', () => {
  let t: AdminTestApp;
  let clock = START;
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => clock });
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    clock = START;
    await t.owner.query(
      'TRUNCATE scan_quota_audit, scan_quota_policy_audit, family_scan_quotas, scan_quota_months, scan_quota_policy, ai_provider_charges, ai_billing_sources, extraction_spend CASCADE',
    );
    for (const provider of ['openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), START],
      );
    await t.owner.query("INSERT INTO extraction_spend (month,cap_usd) VALUES ('2026-10',5)");
    // GET chỉ đọc để pool app mở sẵn kết nối; kết nối đầu tiên có thể chậm hơn cửa sổ chờ khóa.
    expect((await t.call(t.admin, 'GET', '/api/admin/scan-quotas')).status).toBe(200);
  });
  // Giao dịch bị từ chối rollback cả dòng singleton nên đọc COALESCE thay vì giả định đã có dòng.
  const policyVersion = async () =>
    (await t.owner.query('SELECT COALESCE(max(version),0)::text AS v FROM scan_quota_policy')).rows[0]?.v;
  const grant = (familyId: string) =>
    t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: 0,
      grants: [{ familyId, status: 'approved', grantedScans: 1, reason: 'Duyệt tháng' }],
    });
  async function blockThenAdvance(
    lock: 'budget' | 'family',
    pendingAction: () => Response | Promise<Response>,
    next: Date,
    familyId?: string,
  ): Promise<Response> {
    await t.owner.query('BEGIN');
    if (lock === 'budget')
      await t.owner.query("SELECT month FROM extraction_spend WHERE month='2026-10' FOR UPDATE");
    else await t.owner.query('SELECT id FROM families WHERE id=$1 FOR UPDATE', [familyId]);
    const pending = pendingAction();
    try {
      await waitForLock(t);
      clock = next;
    } finally {
      await t.owner.query('ROLLBACK');
    }
    return pending;
  }
  it('TC-581: duyệt chờ khóa ngân sách qua tháng trả conflict và không ghi lượt', async () => {
    const familyId = await t.seedFamily();
    const response = await blockThenAdvance(
      'budget',
      () => grant(familyId),
      new Date('2026-10-31T17:00:00Z'),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_SCAN_QUOTA_CONFLICT' } });
    expect((await t.owner.query('SELECT count(*) FROM family_scan_quotas')).rows[0]?.count).toBe('0');
    expect(await policyVersion()).toBe('0');
  });
  it('TC-585: duyệt chờ khóa gia đình kiểm tra lại billing hết hạn trước khi ghi', async () => {
    const familyId = await t.seedFamily();
    const response = await blockThenAdvance(
      'family',
      () => grant(familyId),
      new Date(START.getTime() + 181000),
      familyId,
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_SCAN_QUOTA_UNAVAILABLE' } });
    expect((await t.owner.query('SELECT count(*) FROM scan_quota_audit')).rows[0]?.count).toBe('0');
  });
  it('TC-583: lần duyệt sau chờ khóa ghi audit và phản hồi theo cùng thời gian cuối', async () => {
    const familyId = await t.seedFamily();
    const finalTime = new Date(START.getTime() + 60000);
    const response = await blockThenAdvance('family', () => grant(familyId), finalTime, familyId);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      month: '2026-10',
      version: 1,
      billingStatus: 'ready',
      committedRemainingScans: '1',
    });
    expect((await t.owner.query('SELECT occurred_at FROM scan_quota_audit')).rows[0]?.occurred_at).toEqual(
      finalTime,
    );
  });
  it('TC-578: UUID khác hoa/thường bị từ chối trước mọi thay đổi quota và audit', async () => {
    const familyId = await t.seedFamily();
    const entry = { familyId, status: 'approved', grantedScans: 2, reason: 'Duyệt tháng' };
    const response = await t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: 0,
      grants: [entry, { ...entry, familyId: familyId.toUpperCase(), grantedScans: 3 }],
    });
    expect(response.status).toBe(422);
    expect((await t.owner.query('SELECT count(*) FROM family_scan_quotas')).rows[0]?.count).toBe('0');
    expect((await t.owner.query('SELECT count(*) FROM scan_quota_audit')).rows[0]?.count).toBe('0');
    expect(
      (
        await t.owner.query(
          'SELECT COALESCE(sum(committed_remaining_scans),0)::text AS n FROM scan_quota_months',
        )
      ).rows[0]?.n,
    ).toBe('0');
    expect(await policyVersion()).toBe('0');
  });
});
