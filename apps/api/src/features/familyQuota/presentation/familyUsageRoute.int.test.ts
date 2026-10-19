import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FamilyUsage, HealthProfile } from '@angia/contracts';
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
    });
    const other = (await (await t.call(owners.b.main, 'GET', '/api/family/usage')).json()) as FamilyUsage;
    expect(other.storage.usedBytes).toBe(7 * MiB);
    expect(other.pendingJobs.used).toBe(1);
  });

  it('TC-301: tài khoản không phải người chăm sóc chính → 403; không phiên → 401', async () => {
    const member = await t.session(owners.a.familyId, 'member');
    expect((await t.call(member, 'GET', '/api/family/usage')).status).toBe(403);
    expect((await t.app.request('/api/family/usage')).status).toBe(401);
  });
});
