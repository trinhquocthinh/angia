import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
const NOW = new Date('2026-10-15T00:00:00Z');
describe('Cấp lượt và requeue nguyên tử', () => {
  let t: AdminTestApp;
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => NOW });
  });
  afterAll(async () => {
    await t?.stop();
  });
  const read = async () => await (await t.call(t.admin, 'GET', '/api/admin/scan-quotas')).json();
  const seedBilling = async () => {
    for (const provider of ['openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources
      (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at)
      VALUES($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), NOW],
      );
  };
  const policy = () =>
    t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
      month: '2026-10',
      expectedVersion: 0,
      policy: { estimatedCostPerScanUsd: '0.1', reserveBasisPoints: 0, trialScans: 0 },
    });
  const grants = (entries: { familyId: string; grantedScans: number }[], expectedVersion: number) =>
    t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion,
      grants: entries.map((entry) => ({ ...entry, status: 'approved', reason: 'Duyệt' })),
    });
  it('TC-631: cấp quota và requeue cùng commit; lỗi hàng đợi rollback toàn bộ', async () => {
    await seedBilling();
    await policy();
    const familyId = await t.seedFamily();
    await t.owner.query(`CREATE FUNCTION fail_quota_requeue() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.name='requeue-awaiting-budget' THEN RAISE EXCEPTION 'synthetic_queue_failure'; END IF;
      RETURN NEW; END; $$;
      CREATE TRIGGER fail_quota_requeue BEFORE INSERT ON pgboss.job FOR EACH ROW EXECUTE FUNCTION fail_quota_requeue()`);
    try {
      expect((await grants([{ familyId, grantedScans: 2 }], 1)).status).toBe(500);
      expect(await read()).toMatchObject({ version: 1, committedRemainingScans: '0' });
      expect(
        (await t.owner.query('SELECT * FROM family_scan_quotas WHERE family_id=$1', [familyId])).rowCount,
      ).toBe(0);
      expect(
        (await t.owner.query('SELECT * FROM scan_quota_audit WHERE family_id=$1', [familyId])).rowCount,
      ).toBe(0);
    } finally {
      await t.owner.query(
        'DROP TRIGGER fail_quota_requeue ON pgboss.job; DROP FUNCTION fail_quota_requeue()',
      );
    }
    expect((await grants([{ familyId, grantedScans: 2 }], 1)).status).toBe(200);
    expect(
      (
        await t.owner.query(
          "SELECT * FROM pgboss.job WHERE name='requeue-awaiting-budget' AND data->>'familyId'=$1",
          [familyId],
        )
      ).rowCount,
    ).toBe(1);
  });
});
