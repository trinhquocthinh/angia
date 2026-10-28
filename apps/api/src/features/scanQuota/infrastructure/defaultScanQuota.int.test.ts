import { randomUUID } from 'node:crypto';
import { adminScanQuotaViewSchema, familyScanQuotaSchema } from '@angia/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';

const NOW = new Date('2026-10-15T00:00:00Z');
const DEFAULTS = { monthlyScans: 10, reserveBasisPoints: 1500, initialCostPerScanUsd: '0.001594' };
describe('CP5.5: lượt mặc định mỗi gia đình qua API thật', () => {
  let t: AdminTestApp;
  const read = async () =>
    adminScanQuotaViewSchema.parse(await (await t.call(t.admin, 'GET', '/api/admin/scan-quotas')).json());
  const grant = async (familyId: string, grantedScans: number) =>
    t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: (await read()).version,
      grants: [{ familyId, status: 'approved', grantedScans, reason: 'Nâng hạng' }],
    });
  // Không xóa families (CASCADE xóa phiên Admin); kỳ vọng tính theo số gia đình hiện có.
  const families = async () => Number((await t.owner.query('SELECT count(*) FROM families')).rows[0].count);
  const rows = async () =>
    (await t.owner.query('SELECT family_id, granted_scans::int AS granted FROM family_scan_quotas')).rows;
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => NOW, scanQuotaDefaults: DEFAULTS });
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    await t.owner.query(
      'TRUNCATE scan_quota_audit, family_scan_quotas, scan_quota_months, scan_quota_policy, ai_provider_charges, ai_billing_sources, extraction_spend CASCADE',
    );
    for (const provider of ['woku', 'openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources (id, provider, credential_fingerprint, status, last_attempt_at, last_complete_at) VALUES ($1,$2,$3,'complete',$4,$4)`,
        [randomUUID(), provider, randomUUID(), NOW],
      );
  });

  it('TC-636: gia đình chưa có dòng tháng đọc được lượt mặc định, GET không ghi DB', async () => {
    const familyId = await t.seedFamily();
    const user = await seedSession(t.owner, await seedAccount(t.owner, { familyId, familyRole: 'member' }));
    const quota = familyScanQuotaSchema.parse(
      await (await t.call(user, 'GET', '/api/family/scan-quota')).json(),
    );
    expect(quota).toMatchObject({ status: 'default', grantedScans: 10, remainingScans: 10 });
    expect(await rows()).toEqual([]);
  });

  it('TC-640: lượt cam kết cộng mặc định cho mọi gia đình chưa có dòng; tổng quan dùng thông số env', async () => {
    await t.seedFamily();
    await t.seedFamily();
    const committed = 10 * (await families());
    const view = await read();
    // Trần mặc định 5 USD, dự phòng 15%: floor(4.25 / 0.001594) = 2666 lượt đủ tiền.
    expect(view).toMatchObject({
      committedRemainingScans: String(committed),
      policy: { estimatedCostPerScanUsd: '0.001594000000', reserveBasisPoints: 1500, trialScans: 10 },
      availableAdditionalScans: String(2666 - committed),
    });
    expect(new Set(view.families.map((family) => family.quota.status))).toEqual(new Set(['default']));
  });

  it('TC-642: nâng hạng gia đình chưa có dòng tính delta so với mặc định; vượt dự toán bị từ chối', async () => {
    const a = await t.seedFamily();
    await t.seedFamily();
    const committed = 10 * (await families()) + 20;
    expect((await grant(a, 30)).status).toBe(200);
    expect(await read()).toMatchObject({
      committedRemainingScans: String(committed),
      availableAdditionalScans: String(2666 - committed),
    });
    const refused = await grant(a, 3000);
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ error: { code: 'ERR_SCAN_QUOTA_UNAVAILABLE' } });
    expect((await grant(a, 5)).status).toBe(409);
  });

  it('TC-644: tạo gia đình không cấp lượt dùng thử, gia đình mới hiện lượt mặc định', async () => {
    const response = await t.call(t.admin, 'POST', '/api/admin/families', { name: 'Nhà mới' });
    expect(response.status).toBe(201);
    const family = (await response.json()) as { id: string };
    expect(await rows()).toEqual([]);
    expect((await read()).families.find((f) => f.familyId === family.id)?.quota).toMatchObject({
      status: 'default',
      grantedScans: 10,
    });
  });
});
