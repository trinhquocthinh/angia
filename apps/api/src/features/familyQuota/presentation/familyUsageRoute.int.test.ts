import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { budgetMonth, type FamilyUsage, type HealthProfile } from '@angia/contracts';
import { seedQuotaDocument } from '@src/shared/test/seedQuotaDocument.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { vietnamDayBounds } from '../domain/vietnamDayBounds.js';

const MiB = 1024 * 1024;

describe('GET /api/family/usage — mức đã dùng của gia đình (SPEC-030)', () => {
  let t: ProfileTestApp;
  const owners: Record<'a' | 'b', { familyId: string; profileId: string; main: SeededSession }> = {} as never;
  beforeAll(async () => {
    t = await startProfileTestApp();
    for (const key of ['a', 'b'] as const) {
      const familyId = await t.family();
      const main = await t.session(familyId);
      const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Bà' });
      owners[key] = { familyId, main, profileId: ((await created.json()) as HealthProfile).id };
    }
  });
  afterAll(async () => t.stop());

  const seed = (key: 'a' | 'b', doc: Parameters<typeof seedQuotaDocument>[2]) => {
    const { familyId, profileId, main } = owners[key];
    return seedQuotaDocument(t, { familyId, profileId, accountId: main.accountId }, doc);
  };

  it('TC-301: chỉ trả số của gia đình phiên, đếm dung lượng mọi trạng thái, ảnh hôm nay giờ VN và chờ worker', async () => {
    const { start, end } = vietnamDayBounds(new Date());
    await seed('a', { status: 'uploaded', sizeBytes: 3 * MiB });
    await seed('a', {
      status: 'rejected',
      sizeBytes: 2 * MiB,
      createdAt: new Date(start.getTime() - 60_000),
    });
    await seed('a', { status: 'awaiting_privacy', sizeBytes: MiB, privacyDraftPending: true });
    await seed('b', { status: 'extracting', sizeBytes: 7 * MiB });
    const response = await t.call(owners.a.main, 'GET', '/api/family/usage');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const resetsAt = new Date(end.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
    expect((await response.json()) as FamilyUsage).toEqual({
      storage: { usedBytes: 6 * MiB, limitBytes: 2 * 1024 * MiB },
      dailyUploads: { used: 2, limit: 100, resetsAt: `${resetsAt}T00:00:00+07:00` },
      pendingJobs: { used: 2, limit: 10 },
      aiOcr: { month: budgetMonth(new Date()), usedPercent: 0, anyUsed: false, exhausted: false },
    });
    const other = (await (await t.call(owners.b.main, 'GET', '/api/family/usage')).json()) as FamilyUsage;
    expect(other.storage.usedBytes).toBe(7 * MiB);
    expect(other.pendingJobs.used).toBe(1);
  });

  it('chứng từ kẹt ở uploaded quá 1 giờ (job preview đã hết lượt) không còn tính vào chờ worker', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Ông' });
    const profileId = ((await created.json()) as HealthProfile).id;
    const owner = { familyId, profileId, accountId: main.accountId };
    await seedQuotaDocument(t, owner, {
      status: 'uploaded',
      sizeBytes: 1,
      createdAt: new Date(Date.now() - 2 * 3600_000),
    });
    await seedQuotaDocument(t, owner, {
      status: 'uploaded',
      sizeBytes: 1,
      createdAt: new Date(Date.now() - 30 * 60_000),
    });
    const usage = (await (await t.call(main, 'GET', '/api/family/usage')).json()) as FamilyUsage;
    expect(usage.pendingJobs.used).toBe(1);
    expect(usage.storage.usedBytes).toBe(2);
  });

  it('TC-306: aiOcr theo trần gia đình tháng hiện tại; chưa có dòng chi tiêu thì 0% và không ghi DB', async () => {
    const month = budgetMonth(new Date());
    const before = await (await t.call(owners.b.main, 'GET', '/api/family/usage')).json();
    expect((before as FamilyUsage).aiOcr).toEqual({
      month,
      usedPercent: 0,
      anyUsed: false,
      exhausted: false,
    });
    const rows = await t.owner.query(
      'SELECT count(*)::int AS n FROM family_extraction_spend WHERE family_id=$1',
      [owners.b.familyId],
    );
    expect(rows.rows[0].n).toBe(0);
    await t.owner.query(
      `INSERT INTO extraction_spend (month, cap_usd) VALUES ($1, 5) ON CONFLICT DO NOTHING`,
      [month],
    );
    await t.owner.query(
      `INSERT INTO family_extraction_spend (family_id, month, spent_usd) VALUES ($1, $2, 0.49)`,
      [owners.a.familyId, month],
    );
    const usage = (await (await t.call(owners.a.main, 'GET', '/api/family/usage')).json()) as FamilyUsage;
    expect(usage.aiOcr).toEqual({ month, usedPercent: 98, anyUsed: true, exhausted: true });
  });

  it('TC-301: tài khoản không phải người chăm sóc chính → 403; không phiên → 401', async () => {
    const member = await t.session(owners.a.familyId, 'member');
    expect((await t.call(member, 'GET', '/api/family/usage')).status).toBe(403);
    expect((await t.app.request('/api/family/usage')).status).toBe(401);
  });
});
