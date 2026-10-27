import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { createScanQuotaRepository } from './createScanQuotaRepository.js';
import { adminScanQuotaViewSchema } from '@angia/contracts';
const NOW = new Date('2026-10-15T00:00:00Z');
const POLICY = { estimatedCostPerScanUsd: '0.1', reserveBasisPoints: 0, trialScans: 2 };
describe('Giao dịch quota quét, chuyển tháng và RLS', () => {
  let t: AdminTestApp;
  let clock = NOW;
  const read = async () =>
    adminScanQuotaViewSchema.parse(await (await t.call(t.admin, 'GET', '/api/admin/scan-quotas')).json());
  const policy = async () =>
    t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
      month: '2026-10',
      expectedVersion: 0,
      policy: POLICY,
    });
  const grants = (entries: { familyId: string; grantedScans: number }[], version: number) =>
    t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: version,
      grants: entries.map((entry) => ({ ...entry, status: 'approved', reason: 'Duyệt tháng' })),
    });
  const seedBilling = async (age = 0) => {
    for (const provider of ['woku', 'openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources (id, provider, credential_fingerprint, status, last_attempt_at, last_complete_at) VALUES ($1,$2,$3,'complete',$4,$5)`,
        [randomUUID(), provider, randomUUID(), NOW, new Date(NOW.getTime() - age * 1000)],
      );
  };
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => clock });
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    clock = NOW;
    await t.owner.query(
      'TRUNCATE scan_quota_audit, scan_quota_policy_audit, family_scan_quotas, scan_quota_months, scan_quota_policy, ai_provider_charges, ai_billing_sources, extraction_spend CASCADE',
    );
  });
  it('TC-582: cấu hình kho trực tiếp trả DTO chuẩn sau khi có billing', async () => {
    await seedBilling();
    const result = await createScanQuotaRepository(t.database).updatePolicy(
      { month: '2026-10', expectedVersion: 0, policy: POLICY },
      t.admin.accountId,
      { now: NOW, defaultMonthlyCapUsd: 5 },
    );
    expect(result.ok).toBe(true);
  });
  it('TC-582: ràng buộc DB từ chối cấu hình thiếu trường và snapshot không hữu hạn', async () => {
    await expect(
      t.owner.query('INSERT INTO scan_quota_policy (id,estimated_cost_per_scan_usd) VALUES (1,1)'),
    ).rejects.toMatchObject({ code: '23514' });
    for (const value of ['-1', '1.5', 'NaN', 'Infinity'])
      await expect(
        t.owner.query(
          "INSERT INTO scan_quota_months (month,committed_remaining_scans) VALUES ('2026-10',$1)",
          [value],
        ),
      ).rejects.toMatchObject({ code: '23514' });
  });
  it('TC-584: lô vượt sức chứa không ghi một phần và không tăng version', async () => {
    await seedBilling();
    await policy();
    const a = await t.seedFamily();
    const b = await t.seedFamily();
    expect(
      (
        await grants(
          [
            { familyId: a, grantedScans: 30 },
            { familyId: b, grantedScans: 30 },
          ],
          1,
        )
      ).status,
    ).toBe(409);
    expect(await read()).toMatchObject({ version: 1, committedRemainingScans: '0' });
    expect((await t.owner.query('SELECT count(*) FROM scan_quota_audit')).rows[0]?.count).toBe('0');
  });
  it('TC-585: giảm trần tiền giữ nguyên lượt đã cấp và hiển thị cấp vượt', async () => {
    await seedBilling();
    await policy();
    const familyId = await t.seedFamily();
    expect((await grants([{ familyId, grantedScans: 40 }], 1)).status).toBe(200);
    await t.owner.query("UPDATE extraction_spend SET cap_usd=1 WHERE month='2026-10'");
    expect(await read()).toMatchObject({
      monthlyCapUsd: '1.000000000000',
      committedRemainingScans: '40',
      overAllocatedScans: '30',
    });
    expect((await read()).families.find((f) => f.familyId === familyId)?.quota.grantedScans).toBe(40);
  });
  it('TC-585: phí cũ hoặc ở tương lai không được xem là 0 sẵn có', async () => {
    await policy();
    const familyId = await t.seedFamily();
    await seedBilling(181);
    expect(await read()).toMatchObject({
      billingStatus: 'stale',
      actualSpendUsd: null,
      availableAdditionalScans: null,
    });
    expect((await grants([{ familyId, grantedScans: 1 }], 1)).status).toBe(409);
    await t.owner.query('UPDATE ai_billing_sources SET last_complete_at=$1', [
      new Date(NOW.getTime() + 1000),
    ]);
    expect(await read()).toMatchObject({ billingStatus: 'incomplete', actualSpendUsd: null });
  });
  it('TC-583: giữ used và held khi tăng tổng, held chỉ tính một lần trong committed', async () => {
    await seedBilling();
    await policy();
    const familyId = await t.seedFamily();
    await grants([{ familyId, grantedScans: 10 }], 1);
    await t.owner.query('UPDATE family_scan_quotas SET used_scans=3,held_scans=2 WHERE family_id=$1', [
      familyId,
    ]);
    await t.owner.query("UPDATE scan_quota_months SET committed_remaining_scans=7 WHERE month='2026-10'");
    expect((await grants([{ familyId, grantedScans: 12 }], 2)).status).toBe(200);
    expect(await read()).toMatchObject({ committedRemainingScans: '9', availableAdditionalScans: '41' });
    expect((await read()).families.find((f) => f.familyId === familyId)?.quota).toMatchObject({
      usedScans: 3,
      heldScans: 2,
      grantedScans: 12,
      remainingScans: 7,
    });
  });
  it('TC-586: role app không đọc/ghi quota và audit của gia đình khác', async () => {
    await seedBilling();
    await policy();
    const a = await t.seedFamily();
    const b = await t.seedFamily();
    await grants(
      [
        { familyId: a, grantedScans: 3 },
        { familyId: b, grantedScans: 4 },
      ],
      1,
    );
    const client = await t.pool.connect();
    try {
      expect(
        (await client.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0]
          ?.rolbypassrls,
      ).toBe(false);
      expect((await client.query('SELECT * FROM family_scan_quotas')).rows).toEqual([]);
      for (const table of ['family_scan_quotas', 'scan_quota_audit']) {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.family_id',$1,true)", [a]);
        expect((await client.query(`SELECT * FROM ${table} WHERE family_id=$1`, [b])).rows).toEqual([]);
        expect(
          (await client.query(`UPDATE ${table} SET family_id=family_id WHERE family_id=$1`, [b])).rowCount,
        ).toBe(0);
        await client.query('ROLLBACK');
      }
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.family_id',$1,true)", [a]);
      await expect(
        client.query(
          `INSERT INTO family_scan_quotas (family_id,month,status,granted_scans,updated_at,updated_by) VALUES ($1,'2026-10','approved',1,$2,$3)`,
          [randomUUID(), NOW, t.admin.accountId],
        ),
      ).rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    const quota = await createScanQuotaRepository(t.database).readFamily(a, NOW);
    expect(quota.grantedScans).toBe(3);
    await withFamilyScope(t.database, a, async (tx) => {
      expect(tx).toBeDefined();
    });
  });
  it('TC-581: sau khi khóa nếu đã sang tháng thì hủy toàn bộ yêu cầu cũ', async () => {
    await policy();
    const actor = (await t.owner.query('SELECT id FROM accounts WHERE is_system_admin=true LIMIT 1')).rows[0]!
      .id as string;
    const repository = createScanQuotaRepository(t.database);
    expect(
      await repository.updatePolicy({ month: '2026-10', expectedVersion: 1, policy: POLICY }, actor, {
        now: NOW,
        recheckNow: () => new Date('2026-10-31T17:00:00Z'),
        defaultMonthlyCapUsd: 5,
      }),
    ).toEqual({ ok: false, code: 'ERR_SCAN_QUOTA_CONFLICT' });
    expect((await read()).version).toBe(1);
  });
  it('TC-587: thiếu sức chứa vẫn tạo gia đình mà không cấp trial một phần', async () => {
    await seedBilling();
    await policy();
    await t.owner.query(
      "INSERT INTO extraction_spend (month,cap_usd) VALUES ('2026-10',0) ON CONFLICT (month) DO UPDATE SET cap_usd=0",
    );
    const response = await t.call(t.admin, 'POST', '/api/admin/families', { name: 'Nhà thử' });
    expect(response.status).toBe(201);
    const family = (await response.json()) as { id: string };
    expect((await read()).families.find((f) => f.familyId === family.id)?.quota.status).toBe('unconfigured');
  });
  it('TC-588: tháng mới giữ cấu hình, không chép lượt, chỉ gợi ý approved tháng trước', async () => {
    await seedBilling();
    await policy();
    const a = await t.seedFamily();
    await grants([{ familyId: a, grantedScans: 12 }], 1);
    const response = await t.call(t.admin, 'POST', '/api/admin/families', { name: 'Nhà dùng thử' });
    const trial = (await response.json()) as { id: string };
    clock = new Date('2026-10-31T17:00:00Z');
    const view = await read();
    expect(view).toMatchObject({
      month: '2026-11',
      committedRemainingScans: '0',
      policy: { estimatedCostPerScanUsd: '0.100000000000' },
    });
    expect(view.families.find((f) => f.familyId === a)).toMatchObject({
      previousApprovedScans: 12,
      quota: { status: 'unconfigured', grantedScans: 0 },
    });
    expect(view.families.find((f) => f.familyId === trial.id)?.previousApprovedScans).toBeNull();
    expect(
      (await t.owner.query("SELECT count(*) FROM scan_quota_months WHERE month='2026-11'")).rows[0]?.count,
    ).toBe('0');
  });
  it('TC-587: lỗi ghi audit rollback cả gia đình, trial và snapshot', async () => {
    await seedBilling();
    await policy();
    await t.owner.query(
      "CREATE FUNCTION fail_trial_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic'; END; $$; CREATE TRIGGER fail_trial_audit BEFORE INSERT ON scan_quota_audit FOR EACH ROW EXECUTE FUNCTION fail_trial_audit()",
    );
    try {
      expect((await t.call(t.admin, 'POST', '/api/admin/families', { name: 'Nhà rollback' })).status).toBe(
        500,
      );
      expect(
        (await t.owner.query('SELECT count(*) FROM families WHERE name=$1', ['Nhà rollback'])).rows[0]?.count,
      ).toBe('0');
      expect(await read()).toMatchObject({ version: 1, committedRemainingScans: '0' });
    } finally {
      await t.owner.query(
        'DROP TRIGGER fail_trial_audit ON scan_quota_audit; DROP FUNCTION fail_trial_audit()',
      );
    }
  });
});
