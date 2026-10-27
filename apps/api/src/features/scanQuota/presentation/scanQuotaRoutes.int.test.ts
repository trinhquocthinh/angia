import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { adminScanQuotaViewSchema, familyScanQuotaSchema } from '@angia/contracts';
const NOW = new Date('2026-10-15T00:00:00Z');
const POLICY = { estimatedCostPerScanUsd: '0.1', reserveBasisPoints: 0, trialScans: 2 };
const PATH = '/api/admin/scan-quotas';
describe('Quota quét theo tháng với PostgreSQL và role app', () => {
  let t: AdminTestApp;
  const read = async () => adminScanQuotaViewSchema.parse(await (await t.call(t.admin, 'GET', PATH)).json());
  const policy = (expectedVersion = 0, value = POLICY) =>
    t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
      month: '2026-10',
      expectedVersion,
      policy: value,
    });
  const grant = (familyId: string, grantedScans: number, expectedVersion: number) =>
    t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion,
      grants: [{ familyId, status: 'approved', grantedScans, reason: 'Duyệt tháng' }],
    });
  const seedBilling = async () => {
    for (const provider of ['woku', 'openrouter'])
      await t.owner.query(
        `INSERT INTO ai_billing_sources (id, provider, credential_fingerprint, status, last_attempt_at, last_complete_at) VALUES ($1,$2,$4,'complete',$3,$3)`,
        [randomUUID(), provider, NOW, randomUUID()],
      );
  };
  beforeAll(async () => {
    t = await startAdminTestApp({ scanQuotaNow: () => NOW });
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    // Audit bất biến nên cô lập bằng TRUNCATE role owner trong fixture.
    await t.owner.query(
      'TRUNCATE ocr_operations, scan_quota_audit, scan_quota_policy_audit, family_scan_quotas, scan_quota_months, scan_quota_policy, ai_provider_charges, ai_billing_sources',
    );
  });
  it('TC-582: GET không ghi mặc định, unknown khác 0 và mọi phản hồi no-store', async () => {
    const familyId = await t.seedFamily();
    const response = await t.call(t.admin, 'GET', PATH);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const view = adminScanQuotaViewSchema.parse(await response.json());
    expect(view).toMatchObject({
      version: 0,
      policy: null,
      actualSpendUsd: null,
      availableAdditionalScans: null,
      runtimeActive: true,
    });
    expect(view.families.find((f) => f.familyId === familyId)?.quota).toMatchObject({
      status: 'unconfigured',
      grantedScans: 0,
    });
    expect((await t.owner.query('SELECT count(*) FROM scan_quota_policy')).rows[0]?.count).toBe('0');
  });
  it('TC-583: cấp tổng, audit, cùng tổng không cộng lại và từ chối giảm', async () => {
    await seedBilling();
    const familyId = await t.seedFamily();
    expect((await policy()).status).toBe(200);
    expect((await grant(familyId, 10, 1)).status).toBe(200);
    expect((await grant(familyId, 10, 2)).status).toBe(200);
    expect(await read()).toMatchObject({
      version: 3,
      committedRemainingScans: '10',
      availableAdditionalScans: '40',
    });
    expect((await grant(familyId, 9, 3)).status).toBe(409);
    expect((await read()).version).toBe(3);
    expect(
      (await t.owner.query('SELECT count(*) FROM scan_quota_audit WHERE family_id=$1', [familyId])).rows[0]
        ?.count,
    ).toBe('2');
    await expect(t.owner.query('UPDATE scan_quota_audit SET reason=$1', ['đổi'])).rejects.toMatchObject({
      code: '55000',
    });
  });
  it('TC-584: CAS và hai Admin không thể cấp vượt sức chứa; lô sai không ghi một phần', async () => {
    await seedBilling();
    await policy();
    const a = await t.seedFamily();
    const b = await t.seedFamily();
    const responses = await Promise.all([grant(a, 40, 1), grant(b, 40, 1)]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const deniedFamily = responses[0]?.status === 409 ? a : b;
    expect((await grant(deniedFamily, 40, 2)).status).toBe(409);
    const current = await read();
    const batch = await t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: current.version,
      grants: [
        { familyId: a, status: 'approved', grantedScans: 45, reason: 'Duyệt' },
        { familyId: randomUUID(), status: 'approved', grantedScans: 0, reason: 'Duyệt' },
      ],
    });
    expect(batch.status).toBe(404);
    expect((await read()).committedRemainingScans).toBe('40');
  });
  it('TC-585: cấu hình mới không cắt lượt và billing thiếu không cho cấp', async () => {
    const familyId = await t.seedFamily();
    await policy();
    expect((await grant(familyId, 1, 1)).status).toBe(409);
    await seedBilling();
    expect((await grant(familyId, 40, 1)).status).toBe(200);
    expect((await policy(2, { ...POLICY, reserveBasisPoints: 10000 })).status).toBe(200);
    expect(await read()).toMatchObject({
      committedRemainingScans: '40',
      availableAdditionalScans: '0',
      overAllocatedScans: '40',
    });
  });
  it('TC-586: chỉ phiên gia đình được đọc lượt; không chọn nhóm qua query/path', async () => {
    await seedBilling();
    await policy();
    const a = await t.seedFamily();
    const b = await t.seedFamily();
    await grant(a, 4, 1);
    for (const familyRole of ['main', 'member'] as const) {
      const user = await seedSession(t.owner, await seedAccount(t.owner, { familyId: a, familyRole }));
      const response = await t.call(user, 'GET', '/api/family/scan-quota');
      expect(familyScanQuotaSchema.parse(await response.json())).toMatchObject({
        grantedScans: 4,
        runtimeActive: true,
      });
      expect((await t.call(user, 'GET', `/api/family/scan-quota?familyId=${b}`)).status).toBe(422);
      expect((await t.call(user, 'GET', `/api/family/scan-quota/${b}`)).status).toBe(404);
      expect((await t.call(user, 'GET', PATH)).status).toBe(403);
    }
    expect((await t.app.request('/api/family/scan-quota')).status).toBe(401);
    expect((await t.call(t.admin, 'GET', '/api/family/scan-quota')).status).toBe(403);
  });
  it('TC-587: trial chỉ lúc tạo mới, thiếu điều kiện vẫn tạo gia đình', async () => {
    const create = () => t.call(t.admin, 'POST', '/api/admin/families', { name: 'Nhà mới' });
    expect((await create()).status).toBe(201);
    await policy();
    await seedBilling();
    const response = await create();
    expect(response.status).toBe(201);
    const family = (await response.json()) as { id: string };
    expect((await read()).families.find((f) => f.familyId === family.id)?.quota).toMatchObject({
      status: 'trial',
      grantedScans: 2,
    });
    expect((await read()).committedRemainingScans).toBe('2');
  });
  it('TC-588: chặn xác thực/CSRF, request lạ và tháng cũ', async () => {
    const unauthenticated = await t.app.request(PATH);
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.headers.get('cache-control')).toBe('no-store');
    const response = await t.app.request('/api/admin/scan-quota-policy', {
      method: 'PUT',
      headers: { cookie: t.admin.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ month: '2026-10', expectedVersion: 0, policy: POLICY }),
    });
    expect(response.status).toBe(403);
    expect(
      (
        await t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
          month: '2026-09',
          expectedVersion: 0,
          policy: POLICY,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
          month: '2026-10',
          expectedVersion: 0,
          policy: POLICY,
          capUsd: 10,
        })
      ).status,
    ).toBe(422);
  });
});
