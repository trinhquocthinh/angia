import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
const NOW = new Date('2026-10-15T00:00:00Z');
// Chờ bằng chứng PostgreSQL đang chặn trên owner giữ account, không dựa vào nhịp request ngẫu nhiên.
async function waitForAccountBlock(t: AdminTestApp): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await t.owner.query(`SELECT pid FROM pg_stat_activity
      WHERE usename='angia_test_app' AND wait_event_type='Lock'
        AND pg_backend_pid()=ANY(pg_blocking_pids(pid))`);
    if (result.rowCount === 1) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Không thấy giao dịch quota chờ khóa tài khoản của owner');
}
describe('Thứ tự khóa tài khoản và quota gia đình', () => {
  let t: AdminTestApp;
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => NOW });
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-584: đang đổi thành viên vẫn khóa được gia đình trước giao dịch quota chờ cùng actor', async () => {
    for (const provider of ['woku', 'openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), NOW],
      );
    const familyId = await t.seedFamily();
    const policy = await t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
      month: '2026-10',
      expectedVersion: 0,
      policy: { estimatedCostPerScanUsd: '0.1', reserveBasisPoints: 0, trialScans: 0 },
    });
    expect(policy.status).toBe(200);
    await t.owner.query('BEGIN');
    await t.owner.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE', [t.admin.accountId]);
    const pending = t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: 1,
      grants: [{ familyId, status: 'approved', grantedScans: 1, reason: 'Duyệt tháng' }],
    });
    try {
      await waitForAccountBlock(t);
      const family = await t.owner.query('SELECT id FROM families WHERE id=$1 FOR UPDATE NOWAIT', [familyId]);
      expect(family.rowCount).toBe(1);
    } finally {
      await t.owner.query('ROLLBACK');
      await pending;
    }
    expect((await pending).status).toBe(200);
  });
});
