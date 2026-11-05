import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
const NOW = new Date('2026-10-15T00:00:00Z');
async function waitForWorkerFamilyLock(t: AdminTestApp, pid: number): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await t.owner.query('SELECT pg_backend_pid()=ANY(pg_blocking_pids($1)) AS blocked', [pid]);
    if (result.rows[0]?.blocked) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Worker chưa chờ khóa FK của gia đình');
}
async function waitForApiFamilyLock(t: AdminTestApp): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    await t.owner.query('SELECT pg_stat_clear_snapshot()');
    const result = await t.owner.query(`SELECT pid FROM pg_stat_activity WHERE usename='angia_test_app'
      AND query LIKE 'SELECT id FROM families WHERE id=%' AND wait_event_type='Lock'
      AND cardinality(pg_blocking_pids(pid))>0`);
    if (result.rowCount === 1) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('API chưa giữ ngân sách và chờ khóa gia đình');
}
describe('Cấp quota cùng lúc worker tạo sổ tiền gia đình', () => {
  let t: AdminTestApp;
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => NOW });
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-584: FK của sổ tiền worker và cấp quota đều hoàn tất khi chờ cùng gia đình', async () => {
    for (const provider of ['openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), NOW],
      );
    const familyId = await t.seedFamily();
    await t.owner.query("INSERT INTO extraction_spend (month,cap_usd) VALUES ('2026-10',5)");
    const worker = await t.pool.connect();
    await worker.query('BEGIN');
    await worker.query("SELECT set_config('app.family_id',$1,true)", [familyId]);
    const workerPid = (await worker.query('SELECT pg_backend_pid() AS pid')).rows[0]!.pid as number;
    await t.owner.query('BEGIN');
    await t.owner.query('SELECT id FROM families WHERE id=$1 FOR UPDATE', [familyId]);
    // FK gia đình được lấy trước FK tháng theo lược đồ thật, giống worker tạo sổ lần đầu.
    const workerRun = worker
      .query(
        "INSERT INTO family_extraction_spend (family_id,month) VALUES ($1,'2026-10') ON CONFLICT DO NOTHING",
        [familyId],
      )
      .then(
        async () => {
          await worker.query('COMMIT');
          return { ok: true };
        },
        async (error: { code?: string }) => {
          await worker.query('ROLLBACK');
          return { ok: false, code: error.code };
        },
      );
    let apiRun: Response | Promise<Response> | undefined;
    try {
      await waitForWorkerFamilyLock(t, workerPid);
      apiRun = t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
        month: '2026-10',
        expectedVersion: 0,
        grants: [{ familyId, status: 'approved', grantedScans: 1, reason: 'Duyệt tháng' }],
      });
      await waitForApiFamilyLock(t);
      await t.owner.query('ROLLBACK');
      const [api, workerResult] = await Promise.all([apiRun, workerRun]);
      expect({ apiStatus: api.status, workerResult }).toEqual({ apiStatus: 200, workerResult: { ok: true } });
      expect(
        (await t.owner.query('SELECT count(*) FROM family_extraction_spend WHERE family_id=$1', [familyId]))
          .rows[0]?.count,
      ).toBe('1');
    } finally {
      await t.owner.query('ROLLBACK');
      await Promise.allSettled([apiRun, workerRun]);
      worker.release();
    }
  });
});
